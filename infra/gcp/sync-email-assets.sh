#!/usr/bin/env bash
# Upload Gorumin email/static assets to a public GCS bucket.
#
# Usage:
#   ./infra/gcp/sync-email-assets.sh [PROJECT_ID] [BUCKET_NAME]
#
# Creates the bucket (if missing), grants public read, uploads brand PNGs,
# and prints EMAIL_LOGO_URL for Medusa .env.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PROJECT_ID="${1:-sims-499022}"
BUCKET="${2:-gorumin-public-assets}"
REGION="${GCP_REGION:-us-central1}"

LOGO_SRC="${ROOT}/assets/brand/gorumin/png/logo/256.png"
ICON_SRC="${ROOT}/assets/brand/gorumin/png/logo/512.png"

if [[ ! -f "$LOGO_SRC" ]]; then
  echo "Missing logo: $LOGO_SRC"
  exit 1
fi

echo "==> Sync email assets → gs://${BUCKET}/email/"
gcloud config set project "$PROJECT_ID" --quiet

gcloud services enable storage.googleapis.com --project="$PROJECT_ID" --quiet

if ! gcloud storage buckets describe "gs://${BUCKET}" &>/dev/null; then
  gcloud storage buckets create "gs://${BUCKET}" \
    --project="$PROJECT_ID" \
    --location="$REGION" \
    --uniform-bucket-level-access
  echo "    bucket created"
else
  echo "    bucket exists"
fi

# Public read for email images (required by Brevo/Gmail — no data: URIs).
gcloud storage buckets add-iam-policy-binding "gs://${BUCKET}" \
  --member=allUsers \
  --role=roles/storage.objectViewer \
  --quiet >/dev/null 2>&1 || true

gcloud storage cp "$LOGO_SRC" "gs://${BUCKET}/email/gorumin-logo-256.png" \
  --cache-control="public, max-age=86400" \
  --content-type="image/png"

if [[ -f "$ICON_SRC" ]]; then
  gcloud storage cp "$ICON_SRC" "gs://${BUCKET}/email/gorumin-logo-512.png" \
    --cache-control="public, max-age=86400" \
    --content-type="image/png"
fi

LOGO_URL="https://storage.googleapis.com/${BUCKET}/email/gorumin-logo-256.png"

echo ""
echo "==> Uploaded. Verify:"
echo "    curl -sI \"$LOGO_URL\" | head -3"
curl -sI "$LOGO_URL" | head -3 || true
echo ""
echo "Add to apps/medusa/.env (and infra/gcp/.env.production):"
echo "    EMAIL_LOGO_URL=${LOGO_URL}"
echo "    EMAIL_VERIFICATION_LAYOUT=stripe"
