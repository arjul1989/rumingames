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
    local bpk="" bbackend="" bbase="" bregion="co" bgoogle="false" bfunding="false"
    while [[ $# -gt 0 ]]; do
      case "$1" in
        --build-arg) local kv="$2"; shift 2
          case "$kv" in NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=*) bpk="${kv#*=}" ;;
            NEXT_PUBLIC_MEDUSA_BACKEND_URL=*) bbackend="${kv#*=}" ;;
            NEXT_PUBLIC_BASE_URL=*) bbase="${kv#*=}" ;;
            NEXT_PUBLIC_DEFAULT_REGION=*) bregion="${kv#*=}" ;;
            NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=*) bgoogle="${kv#*=}" ;;
            NEXT_PUBLIC_FUNDING_ENABLED=*) bfunding="${kv#*=}" ;;
          esac ;;
        *) shift ;;
      esac
    done
    gcloud builds submit "$ROOT" \
      --config "$ROOT/infra/gcp/cloudbuild-storefront.yaml" \
      --substitutions="_IMAGE=${img},_PUBLISHABLE_KEY=${bpk},_BACKEND_URL=${bbackend},_BASE_URL=${bbase},_DEFAULT_REGION=${bregion},_GOOGLE_AUTH_ENABLED=${bgoogle},_FUNDING_ENABLED=${bfunding}" \
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
MP_CALLBACK_URL: "${MP_CALLBACK_URL:-${STOREFRONT_BASE_URL}/co/checkout/pending}"
MP_LOCALE: es-CO
MP_STATEMENT_DESCRIPTOR: GORUMIN
EOF
  [[ -n "${REDIS_URL:-}" ]] && echo "REDIS_URL: \"${REDIS_URL}\"" >>"$env_file"
  [[ -n "${FAZER_API_KEY:-}" ]] && echo "FAZER_API_KEY: \"${FAZER_API_KEY}\"" >>"$env_file"
  [[ -n "${FAZER_BASE_URL:-}" ]] && echo "FAZER_BASE_URL: \"${FAZER_BASE_URL}\"" >>"$env_file"
  [[ -n "${FAZER_BALANCE_ALERT_THRESHOLD:-}" ]] && echo "FAZER_BALANCE_ALERT_THRESHOLD: \"${FAZER_BALANCE_ALERT_THRESHOLD}\"" >>"$env_file"
  [[ -n "${FAZER_WEBHOOK_SECRET:-}" ]] && echo "FAZER_WEBHOOK_SECRET: \"${FAZER_WEBHOOK_SECRET}\"" >>"$env_file"
  [[ -n "${FAZER_WEBHOOK_SIGNATURE_HEADER:-}" ]] && echo "FAZER_WEBHOOK_SIGNATURE_HEADER: \"${FAZER_WEBHOOK_SIGNATURE_HEADER}\"" >>"$env_file"
  [[ -n "${MP_ACCESS_TOKEN:-}" ]] && echo "MP_ACCESS_TOKEN: \"${MP_ACCESS_TOKEN}\"" >>"$env_file"
  [[ -n "${MP_PUBLIC_KEY:-}" ]] && echo "MP_PUBLIC_KEY: \"${MP_PUBLIC_KEY}\"" >>"$env_file"
  [[ -n "${MP_WEBHOOK_SECRET:-}" ]] && echo "MP_WEBHOOK_SECRET: \"${MP_WEBHOOK_SECRET}\"" >>"$env_file"
  [[ -n "${GOOGLE_CLIENT_ID:-}" ]] && echo "GOOGLE_CLIENT_ID: \"${GOOGLE_CLIENT_ID}\"" >>"$env_file"
  [[ -n "${GOOGLE_CLIENT_SECRET:-}" ]] && echo "GOOGLE_CLIENT_SECRET: \"${GOOGLE_CLIENT_SECRET}\"" >>"$env_file"
  [[ -n "${GOOGLE_CALLBACK_URL:-}" ]] && echo "GOOGLE_CALLBACK_URL: \"${GOOGLE_CALLBACK_URL}\"" >>"$env_file"
  [[ -n "${BREVO_API_KEY:-}" ]] && echo "BREVO_API_KEY: \"${BREVO_API_KEY}\"" >>"$env_file"
  [[ -n "${BREVO_FROM_EMAIL:-}" ]] && echo "BREVO_FROM_EMAIL: \"${BREVO_FROM_EMAIL}\"" >>"$env_file"
  [[ -n "${BREVO_SENDER_NAME:-}" ]] && echo "BREVO_SENDER_NAME: \"${BREVO_SENDER_NAME}\"" >>"$env_file"
  [[ -n "${BREVO_REPLY_TO:-}" ]] && echo "BREVO_REPLY_TO: \"${BREVO_REPLY_TO}\"" >>"$env_file"
  [[ -n "${ADMIN_ALERT_EMAIL:-}" ]] && echo "ADMIN_ALERT_EMAIL: \"${ADMIN_ALERT_EMAIL}\"" >>"$env_file"
  [[ -n "${EMAIL_LOGO_URL:-}" ]] && echo "EMAIL_LOGO_URL: \"${EMAIL_LOGO_URL}\"" >>"$env_file"
  echo "EMAIL_VERIFICATION_LAYOUT: \"${EMAIL_VERIFICATION_LAYOUT:-stripe}\"" >>"$env_file"
  [[ -n "${REVALIDATE_SECRET:-}" ]] && echo "REVALIDATE_SECRET: \"${REVALIDATE_SECRET}\"" >>"$env_file"
  echo "FUNDING_ENABLED: \"${FUNDING_ENABLED:-false}\"" >>"$env_file"
  echo "FAZER_FUNDING_METHOD: \"${FAZER_FUNDING_METHOD:-binancepay}\"" >>"$env_file"
  echo "FUNDING_MAX_USD_PER_ORDER: \"${FUNDING_MAX_USD_PER_ORDER:-500}\"" >>"$env_file"
  [[ -n "${BINANCE_API_KEY:-}" ]] && echo "BINANCE_API_KEY: \"${BINANCE_API_KEY}\"" >>"$env_file"
  [[ -n "${BINANCE_API_SECRET:-}" ]] && echo "BINANCE_API_SECRET: \"${BINANCE_API_SECRET}\"" >>"$env_file"
  [[ -n "${BINANCE_PAY_MERCHANT_ID:-}" ]] && echo "BINANCE_PAY_MERCHANT_ID: \"${BINANCE_PAY_MERCHANT_ID}\"" >>"$env_file"
  [[ -n "${BINANCE_PAY_CERTIFICATE_SN:-}" ]] && echo "BINANCE_PAY_CERTIFICATE_SN: \"${BINANCE_PAY_CERTIFICATE_SN}\"" >>"$env_file"
  [[ -n "${BINANCE_PAY_PRIVATE_KEY:-}" ]] && echo "BINANCE_PAY_PRIVATE_KEY: \"${BINANCE_PAY_PRIVATE_KEY}\"" >>"$env_file"

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
  # api.gorumin.com may lack SSL during domain provisioning; allow a separate
  # build-time backend URL (runtime BFF calls use NEXT_PUBLIC_MEDUSA_BACKEND_URL).
  local backend_url="${STOREFRONT_BUILD_BACKEND_URL:-${MEDUSA_BACKEND_URL}}"
  build_push "$ROOT/apps/storefront/Dockerfile" "$img" \
    --build-arg "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${pk}" \
    --build-arg "NEXT_PUBLIC_MEDUSA_BACKEND_URL=${backend_url}" \
    --build-arg "NEXT_PUBLIC_BASE_URL=${STOREFRONT_BASE_URL}" \
    --build-arg "NEXT_PUBLIC_DEFAULT_REGION=co" \
    --build-arg "NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=${NEXT_PUBLIC_GOOGLE_AUTH_ENABLED:-false}" \
    --build-arg "NEXT_PUBLIC_FUNDING_ENABLED=${NEXT_PUBLIC_FUNDING_ENABLED:-false}"

  gcloud run deploy "${STOREFRONT_SERVICE:-gorumin-storefront}" \
    --image "$img" \
    --region "$GCP_REGION" \
    --platform managed \
    --port 8000 \
    --min-instances 0 \
    --max-instances 10 \
    --memory 512Mi \
    ${REVALIDATE_SECRET:+--update-env-vars REVALIDATE_SECRET="${REVALIDATE_SECRET}"} \
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
echo "==> Deploy complete."
echo "    Sync content (fast):  ./infra/gcp/sync-prod.sh"
echo "    Sync Fazer (full):    ./infra/gcp/sync-prod.sh --full"
echo "    Email assets:         ./infra/gcp/sync-email-assets.sh"
echo "    Domain mapping:       ./infra/gcp/remap-domains.sh"
