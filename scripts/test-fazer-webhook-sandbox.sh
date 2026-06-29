#!/usr/bin/env bash
# POST a signed Fazer webhook to sandbox (or MEDUSA_BACKEND_URL from env).
#
# Usage:
#   ./scripts/test-fazer-webhook-sandbox.sh
#   ./scripts/test-fazer-webhook-sandbox.sh --order-id=ord_real_fazer_id
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/infra/gcp/.env.sandbox}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  exit 1
fi

# shellcheck disable=SC1090
set -a && source "$ENV_FILE" && set +a

URL="${WEBHOOK_URL:-${MEDUSA_BACKEND_URL%/}/hooks/fazer}"
EXTRA_ARGS=("$@")

cd "$ROOT/apps/medusa"
npx medusa exec ./src/scripts/verify-fazer-webhook.ts -- --url="$URL" "${EXTRA_ARGS[@]}"
