#!/usr/bin/env bash
# Map sbx.gorumin.com → sandbox storefront, api.sbx.gorumin.com → sandbox medusa.
#
# Usage: ./infra/gcp/remap-domains-sandbox.sh
set -euo pipefail

ENV_FILE="${ENV_FILE:-$(cd "$(dirname "$0")/../.." && pwd)/infra/gcp/.env.sandbox}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE — copy env.sandbox.example first."
  exit 1
fi

# shellcheck disable=SC1090
set -a && source "$ENV_FILE" && set +a

PROJECT_ID="${GCP_PROJECT_ID:-sims-499022}"
REGION="${GCP_REGION:-us-central1}"
STOREFRONT="${STOREFRONT_SERVICE:-gorumin-storefront-sbx}"
MEDUSA="${MEDUSA_SERVICE:-gorumin-medusa-sbx}"
STOREFRONT_DOMAIN="${STOREFRONT_DOMAIN:-sbx.gorumin.com}"
API_DOMAIN="${API_DOMAIN:-api.sbx.gorumin.com}"

gcloud config set project "$PROJECT_ID" --quiet

map_domain() {
  local domain="$1"
  local service="$2"
  echo "==> $domain → $service"
  if gcloud beta run domain-mappings describe --domain="$domain" --region="$REGION" &>/dev/null; then
    echo "    deleting old mapping..."
    gcloud beta run domain-mappings delete --domain="$domain" --region="$REGION" --quiet
  fi
  gcloud beta run domain-mappings create \
    --service="$service" \
    --domain="$domain" \
    --region="$REGION" \
    --quiet
}

map_domain "$STOREFRONT_DOMAIN" "$STOREFRONT"
map_domain "$API_DOMAIN" "$MEDUSA"

echo ""
echo "==> Sandbox domain mappings updated."
echo "    Add DNS records shown by:"
echo "      gcloud beta run domain-mappings describe --domain=$STOREFRONT_DOMAIN --region=$REGION"
echo "      gcloud beta run domain-mappings describe --domain=$API_DOMAIN --region=$REGION"
