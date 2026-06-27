#!/usr/bin/env bash
# Bootstrap Cloud SQL for Gorumin SANDBOX (separate from production).
#
# Usage:
#   ./infra/gcp/bootstrap-sandbox.sh [PROJECT_ID] [REGION]
#
# Creates: gorumin-db-sbx instance, gorumin_medusa_sbx database, gorumin_sbx user.
# Reuses the same Artifact Registry as production (images tagged by git SHA).
set -euo pipefail

PROJECT_ID="${1:-sims-499022}"
REGION="${2:-us-central1}"
SQL_INSTANCE="${SQL_INSTANCE:-gorumin-db-sbx}"
DB_NAME="${DB_NAME:-gorumin_medusa_sbx}"
DB_USER="${DB_USER:-gorumin_sbx}"
AR_REPO="${AR_REPO:-gorumin}"

echo "==> Bootstrap Gorumin SANDBOX in project=$PROJECT_ID region=$REGION"

gcloud config set project "$PROJECT_ID" --quiet

echo "==> Enabling APIs (no-op if already enabled)..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  iamcredentials.googleapis.com \
  --project="$PROJECT_ID" \
  --quiet

echo "==> Artifact Registry repo: $AR_REPO (shared with prod)"
if gcloud artifacts repositories describe "$AR_REPO" \
  --location="$REGION" --project="$PROJECT_ID" &>/dev/null; then
  echo "    already exists"
else
  gcloud artifacts repositories create "$AR_REPO" \
    --repository-format=docker \
    --location="$REGION" \
    --description="Gorumin Medusa + Storefront containers" \
    --project="$PROJECT_ID"
  echo "    created — run ./infra/gcp/bootstrap.sh if you also need prod SQL"
fi

echo "==> Cloud SQL instance (sandbox): $SQL_INSTANCE"
if gcloud sql instances describe "$SQL_INSTANCE" --project="$PROJECT_ID" &>/dev/null; then
  echo "    already exists"
else
  DB_ROOT_PASS="$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)"
  gcloud sql instances create "$SQL_INSTANCE" \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region="$REGION" \
    --storage-type=SSD \
    --storage-size=10GB \
    --backup-start-time=04:00 \
    --root-password="$DB_ROOT_PASS" \
    --project="$PROJECT_ID"
  echo "    created (root password shown once — store in Secret Manager)"
  echo "    ROOT_PASSWORD=$DB_ROOT_PASS"
fi

echo "==> Database + user (sandbox)"
gcloud sql databases create "$DB_NAME" \
  --instance="$SQL_INSTANCE" \
  --project="$PROJECT_ID" 2>/dev/null || echo "    database $DB_NAME already exists"

if ! gcloud sql users list --instance="$SQL_INSTANCE" --project="$PROJECT_ID" \
  --format="value(name)" | grep -qx "$DB_USER"; then
  DB_PASS="$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)"
  gcloud sql users create "$DB_USER" \
    --instance="$SQL_INSTANCE" \
    --password="$DB_PASS" \
    --project="$PROJECT_ID"
  echo "    user $DB_USER created"
  echo "    DB_PASSWORD=$DB_PASS"
else
  echo "    user $DB_USER already exists"
fi

CONN_NAME="${PROJECT_ID}:${REGION}:${SQL_INSTANCE}"
echo ""
echo "==> Sandbox bootstrap complete"
echo "    Cloud SQL connection: $CONN_NAME"
echo "    DATABASE_URL (Cloud Run socket):"
echo "      postgresql://${DB_USER}:<PASSWORD>@/${DB_NAME}?host=/cloudsql/${CONN_NAME}"
echo ""
echo "Next:"
echo "  cp infra/gcp/env.sandbox.example infra/gcp/.env.sandbox"
echo "  fill secrets (use sandbox/test payment keys), then:"
echo "  ./infra/gcp/deploy-sandbox.sh"
echo "  ./infra/gcp/remap-domains-sandbox.sh"
