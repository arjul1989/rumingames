#!/usr/bin/env bash
# Remove the legacy eSIM site (sim-web) after Gorumin cutover is verified.
#
# Usage: ./infra/gcp/cleanup-sim-web.sh [--force]
set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-sims-499022}"
REGION="${GCP_REGION:-us-central1}"
FORCE="${1:-}"

echo "This will DELETE:"
echo "  - Cloud Run service: sim-web"
echo "  - Artifact Registry repo: sim (429MB old eSIM images)"
echo ""
echo "Keep: domain mappings (now pointing to gorumin-storefront), Cloud SQL gorumin-db"
echo ""

if [[ "$FORCE" != "--force" ]]; then
  read -r -p "Type 'delete sim-web' to confirm: " confirm
  [[ "$confirm" == "delete sim-web" ]] || { echo "Aborted."; exit 1; }
fi

gcloud config set project "$PROJECT_ID" --quiet

echo "==> Deleting sim-web..."
gcloud run services delete sim-web --region="$REGION" --quiet 2>/dev/null || echo "    sim-web not found (already deleted)"

echo "==> Deleting Artifact Registry repo: sim..."
gcloud artifacts repositories delete sim \
  --location="$REGION" \
  --quiet 2>/dev/null || echo "    sim repo not found"

echo ""
echo "==> Cleanup complete."
echo "    Rotate any secrets that were exposed on sim-web (Supabase, Zendit, MP, dLocal)."
echo "    See: gcloud run services describe sim-web (should 404 now)"
