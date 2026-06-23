#!/usr/bin/env bash
# Build, push and deploy Gorumin to Cloud Run (manual cutover from sim-web).
#
# Prerequisites:
#   1. ./infra/gcp/bootstrap.sh
#   2. cp infra/gcp/env.production.example infra/gcp/.env.production  (fill values)
#   3. gcloud auth login && docker running
#
# Usage:
#   ./infra/gcp/deploy-prod.sh [both|medusa|storefront]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/infra/gcp/.env.production}"
TARGET="${1:-both}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE — copy env.production.example and fill secrets."
  exit 1
fi

# shellcheck disable=SC1090
set -a && source "$ENV_FILE" && set +a

: "${GCP_PROJECT_ID:?}"
: "${GCP_REGION:?}"
: "${AR_REPO:?}"
: "${SQL_INSTANCE:?}"
: "${DB_NAME:?}"
: "${DB_USER:?}"
: "${DB_PASSWORD:?}"
: "${STOREFRONT_BASE_URL:?}"
: "${MEDUSA_BACKEND_URL:?}"
: "${JWT_SECRET:?}"
: "${COOKIE_SECRET:?}"
: "${DIGITAL_CODE_ENCRYPTION_KEY:?}"

CONN_NAME="${GCP_PROJECT_ID}:${GCP_REGION}:${SQL_INSTANCE}"
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@/${DB_NAME}?host=/cloudsql/${CONN_NAME}"
IMAGE_BASE="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${AR_REPO}"
SHA="$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || echo local)"

gcloud config set project "$GCP_PROJECT_ID" --quiet

build_push() {
  local dockerfile="$1"
  local img="$2"
  shift 2

  if command -v docker &>/dev/null && docker info &>/dev/null 2>&1; then
    gcloud auth configure-docker "${GCP_REGION}-docker.pkg.dev" --quiet
    local -a args=(-f "$dockerfile")
    while [[ $# -gt 0 ]]; do args+=("$1"); shift; done
    docker build "${args[@]}" -t "$img" "$ROOT"
    docker push "$img"
  elif [[ "$(basename "$dockerfile")" == "Dockerfile" && "$dockerfile" == *"/storefront/"* ]]; then
    echo "    (docker unavailable — Cloud Build storefront)"
    local pk="${1#*=}"; shift || true
    # Args passed as --build-arg KEY=VAL pairs from caller
    local bpk="" bbackend="" bbase="" bregion="co"
    while [[ $# -gt 0 ]]; do
      case "$1" in
        --build-arg) local kv="$2"; shift 2
          case "$kv" in NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=*) bpk="${kv#*=}" ;;
            NEXT_PUBLIC_MEDUSA_BACKEND_URL=*) bbackend="${kv#*=}" ;;
            NEXT_PUBLIC_BASE_URL=*) bbase="${kv#*=}" ;;
            NEXT_PUBLIC_DEFAULT_REGION=*) bregion="${kv#*=}" ;;
          esac ;;
        *) shift ;;
      esac
    done
    gcloud builds submit "$ROOT" \
      --config "$ROOT/infra/gcp/cloudbuild-storefront.yaml" \
      --substitutions="_IMAGE=${img},_PUBLISHABLE_KEY=${bpk},_BACKEND_URL=${bbackend},_BASE_URL=${bbase},_DEFAULT_REGION=${bregion}" \
      --quiet
  else
    echo "    (docker unavailable — Cloud Build)"
    local cfg="$ROOT/infra/gcp/cloudbuild-medusa.yaml"
    if [[ "$(basename "$dockerfile")" == "Dockerfile" && "$dockerfile" == *"/storefront/"* ]]; then
      cfg="$ROOT/infra/gcp/cloudbuild-storefront.yaml"
      # handled above — should not reach here
    fi
    gcloud builds submit "$ROOT" \
      --config "$cfg" \
      --substitutions="_IMAGE=${img}" \
      --quiet
  fi
}

deploy_medusa() {
  echo "==> Build & deploy Medusa ($SHA)"
  local img="${IMAGE_BASE}/${MEDUSA_SERVICE:-gorumin-medusa}:${SHA}"
  build_push "$ROOT/apps/medusa/Dockerfile" "$img"

  local env_file
  env_file="$(mktemp)"
  trap 'rm -f "$env_file"' RETURN

  cat >"$env_file" <<EOF
NODE_ENV: production
DATABASE_URL: "${DATABASE_URL}"
JWT_SECRET: "${JWT_SECRET}"
COOKIE_SECRET: "${COOKIE_SECRET}"
DIGITAL_CODE_ENCRYPTION_KEY: "${DIGITAL_CODE_ENCRYPTION_KEY}"
STORE_CORS: "${STORE_CORS}"
ADMIN_CORS: "${ADMIN_CORS}"
AUTH_CORS: "${AUTH_CORS}"
MEDUSA_BACKEND_URL: "${MEDUSA_BACKEND_URL}"
STOREFRONT_URL: "${STOREFRONT_BASE_URL}"
MP_NOTIFICATION_URL: "${MP_NOTIFICATION_URL:-${MEDUSA_BACKEND_URL}/hooks/mercadopago}"
MP_LOCALE: es-CO
MP_STATEMENT_DESCRIPTOR: GORUMIN
EOF
  [[ -n "${REDIS_URL:-}" ]] && echo "REDIS_URL: \"${REDIS_URL}\"" >>"$env_file"
  [[ -n "${FAZER_API_KEY:-}" ]] && echo "FAZER_API_KEY: \"${FAZER_API_KEY}\"" >>"$env_file"
  [[ -n "${MP_ACCESS_TOKEN:-}" ]] && echo "MP_ACCESS_TOKEN: \"${MP_ACCESS_TOKEN}\"" >>"$env_file"
  [[ -n "${MP_PUBLIC_KEY:-}" ]] && echo "MP_PUBLIC_KEY: \"${MP_PUBLIC_KEY}\"" >>"$env_file"
  [[ -n "${MP_WEBHOOK_SECRET:-}" ]] && echo "MP_WEBHOOK_SECRET: \"${MP_WEBHOOK_SECRET}\"" >>"$env_file"

  gcloud run deploy "${MEDUSA_SERVICE:-gorumin-medusa}" \
    --image "$img" \
    --region "$GCP_REGION" \
    --platform managed \
    --port 9000 \
    --min-instances 0 \
    --max-instances 5 \
    --memory 1Gi \
    --cpu 1 \
    --timeout 300 \
    --add-cloudsql-instances "$CONN_NAME" \
    --env-vars-file "$env_file" \
    --allow-unauthenticated \
    --quiet

  echo "    Medusa URL: $(gcloud run services describe "${MEDUSA_SERVICE:-gorumin-medusa}" \
    --region "$GCP_REGION" --format='value(status.url)')"
}

deploy_storefront() {
  local pk="${MEDUSA_PUBLISHABLE_KEY:-}"
  if [[ -z "$pk" ]]; then
    echo "WARN: MEDUSA_PUBLISHABLE_KEY empty — create one in Medusa Admin after first deploy."
    echo "      Re-run deploy-prod.sh storefront once set."
    pk="pk_placeholder_rerun_after_seed"
  fi

  echo "==> Build & deploy Storefront ($SHA)"
  local img="${IMAGE_BASE}/${STOREFRONT_SERVICE:-gorumin-storefront}:${SHA}"
  build_push "$ROOT/apps/storefront/Dockerfile" "$img" \
    --build-arg "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${pk}" \
    --build-arg "NEXT_PUBLIC_MEDUSA_BACKEND_URL=${MEDUSA_BACKEND_URL}" \
    --build-arg "NEXT_PUBLIC_BASE_URL=${STOREFRONT_BASE_URL}" \
    --build-arg "NEXT_PUBLIC_DEFAULT_REGION=co"

  gcloud run deploy "${STOREFRONT_SERVICE:-gorumin-storefront}" \
    --image "$img" \
    --region "$GCP_REGION" \
    --platform managed \
    --port 8000 \
    --min-instances 0 \
    --max-instances 10 \
    --memory 512Mi \
    --allow-unauthenticated \
    --quiet

  echo "    Storefront URL: $(gcloud run services describe "${STOREFRONT_SERVICE:-gorumin-storefront}" \
    --region "$GCP_REGION" --format='value(status.url)')"
}

case "$TARGET" in
  medusa) deploy_medusa ;;
  storefront) deploy_storefront ;;
  both)
    deploy_medusa
    deploy_storefront
    ;;
  *) echo "Usage: $0 [both|medusa|storefront]"; exit 1 ;;
esac

echo ""
echo "==> Deploy complete. Next: ./infra/gcp/remap-domains.sh"
