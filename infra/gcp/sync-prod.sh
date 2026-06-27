#!/usr/bin/env bash
# Sync storefront content against the production Cloud SQL database.
#
# Prerequisites:
#   1. infra/gcp/.env.production filled (same as deploy-prod.sh)
#   2. gcloud auth login
#   3. cloud-sql-proxy (brew install cloud-sql-proxy)
#
# Usage:
#   ./infra/gcp/sync-prod.sh           # fast (~30 s): CMS + images + cache purge
#   ./infra/gcp/sync-prod.sh --push    # + push variant prices from DB (~10–15 min)
#   ./infra/gcp/sync-prod.sh --full    # + live Fazer API pull (~25+ min, nightly only)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/infra/gcp/.env.production}"
PROXY_PORT="${PROXY_PORT:-5433}"
SYNC_MODE="fast"

case "${1:-}" in
  ""|--fast) SYNC_MODE="fast" ;;
  --push) SYNC_MODE="push" ;;
  --full) SYNC_MODE="full" ;;
  *)
    echo "Usage: $0 [--fast|--push|--full]"
    exit 1
    ;;
esac

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE — copy env.production.example and fill secrets."
  exit 1
fi

# shellcheck disable=SC1090
set -a && source "$ENV_FILE" && set +a

: "${GCP_PROJECT_ID:?}"
: "${GCP_REGION:?}"
: "${SQL_INSTANCE:?}"
: "${DB_NAME:?}"
: "${DB_USER:?}"
: "${DB_PASSWORD:?}"
: "${STOREFRONT_BASE_URL:?}"
: "${MEDUSA_BACKEND_URL:?}"

if ! command -v cloud-sql-proxy &>/dev/null; then
  echo "cloud-sql-proxy not found. Install: brew install cloud-sql-proxy"
  exit 1
fi

CONN_NAME="${GCP_PROJECT_ID}:${GCP_REGION}:${SQL_INSTANCE}"
PROXY_PID=""

cleanup() {
  if [[ -n "$PROXY_PID" ]]; then
    kill "$PROXY_PID" 2>/dev/null || true
    wait "$PROXY_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo "==> Starting Cloud SQL proxy on 127.0.0.1:${PROXY_PORT} (${CONN_NAME})"
gcloud config set project "$GCP_PROJECT_ID" --quiet >/dev/null
cloud-sql-proxy "$CONN_NAME" \
  --port "$PROXY_PORT" \
  --quota-project "$GCP_PROJECT_ID" \
  --gcloud-auth &
PROXY_PID=$!

for _ in $(seq 1 30); do
  if (echo >/dev/tcp/127.0.0.1/"$PROXY_PORT") &>/dev/null; then
    break
  fi
  sleep 0.5
done

export NODE_ENV=production
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:${PROXY_PORT}/${DB_NAME}"
export STOREFRONT_URL="${STOREFRONT_BASE_URL}"
export MEDUSA_BACKEND_URL
export REVALIDATE_SECRET="${REVALIDATE_SECRET:-}"
export SYNC_MODE
export FAZER_API_KEY="${FAZER_API_KEY:-}"

echo "==> Running storefront content sync (${SYNC_MODE}) against production DB"
echo "    STOREFRONT_URL=${STOREFRONT_URL}"

cd "$ROOT/apps/medusa"
npx medusa exec ./src/scripts/sync-storefront-content.ts

echo ""
echo "==> Production sync complete (${SYNC_MODE})."
