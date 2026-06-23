#!/usr/bin/env bash
# Point gorumin.com → storefront and api.gorumin.com → medusa.
# Replaces the old sim-web domain mapping on the same GCP project.
#
# Usage: ./infra/gcp/remap-domains.sh
set -euo pipefail

ENV_FILE="${ENV_FILE:-$(cd "$(dirname "$0")/../.." && pwd)/infra/gcp/.env.production}"
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a && source "$ENV_FILE" && set +a
fi

PROJECT_ID="${GCP_PROJECT_ID:-sims-499022}"
REGION="${GCP_REGION:-us-central1}"
STOREFRONT="${STOREFRONT_SERVICE:-gorumin-storefront}"
MEDUSA="${MEDUSA_SERVICE:-gorumin-medusa}"

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

map_domain "gorumin.com" "$STOREFRONT"
map_domain "www.gorumin.com" "$STOREFRONT"
map_domain "api.gorumin.com" "$MEDUSA"

echo ""
echo "==> Domain mappings updated."
echo "    If api.gorumin.com is new, add the DNS records shown by:"
echo "      gcloud beta run domain-mappings describe --domain=api.gorumin.com --region=$REGION"
echo "    gorumin.com / www DNS should stay as-is (already pointing to Cloud Run)."
