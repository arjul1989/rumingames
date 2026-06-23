#!/usr/bin/env bash
# Bootstrap GCP resources for Gorumin (US-0.2 / RUM-7).
# Reuses project sims-499022 — domain gorumin.com is already verified there.
#
# Usage:
#   ./infra/gcp/bootstrap.sh [PROJECT_ID] [REGION]
#
# Creates: APIs, Artifact Registry (gorumin), Cloud SQL Postgres, Secret Manager
# placeholders. Does NOT delete sim-web (run cleanup-sim-web.sh after cutover).
set -euo pipefail

PROJECT_ID="${1:-sims-499022}"
REGION="${2:-us-central1}"
SQL_INSTANCE="${SQL_INSTANCE:-gorumin-db}"
DB_NAME="${DB_NAME:-gorumin_medusa}"
DB_USER="${DB_USER:-gorumin}"
AR_REPO="${AR_REPO:-gorumin}"

echo "==> Bootstrap Gorumin in project=$PROJECT_ID region=$REGION"

gcloud config set project "$PROJECT_ID" --quiet

echo "==> Enabling APIs..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  iamcredentials.googleapis.com \
  --project="$PROJECT_ID" \
  --quiet

echo "==> Artifact Registry repo: $AR_REPO"
if gcloud artifacts repositories describe "$AR_REPO" \
  --location="$REGION" --project="$PROJECT_ID" &>/dev/null; then
  echo "    already exists"
else
  gcloud artifacts repositories create "$AR_REPO" \
    --repository-format=docker \
    --location="$REGION" \
    --description="Gorumin Medusa + Storefront containers" \
    --project="$PROJECT_ID"
  echo "    created"
fi

echo "==> Cloud SQL instance: $SQL_INSTANCE"
if gcloud sql instances describe "$SQL_INSTANCE" --project="$PROJECT_ID" &>/dev/null; then
  echo "    already exists"
else
  # db-f1-micro is the cheapest tier (~USD 7–10/mo). Upgrade for production load.
  DB_ROOT_PASS="$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)"
  gcloud sql instances create "$SQL_INSTANCE" \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region="$REGION" \
    --storage-type=SSD \
    --storage-size=10GB \
    --backup-start-time=03:00 \
    --root-password="$DB_ROOT_PASS" \
    --project="$PROJECT_ID"
  echo "    created (root password shown once — store in Secret Manager)"
  echo "    ROOT_PASSWORD=$DB_ROOT_PASS"
fi

echo "==> Database + user"
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
echo "==> Bootstrap complete"
echo "    Cloud SQL connection: $CONN_NAME"
echo "    DATABASE_URL (Cloud Run socket):"
echo "      postgresql://${DB_USER}:<PASSWORD>@/${DB_NAME}?host=/cloudsql/${CONN_NAME}"
echo ""
echo "Next: copy infra/gcp/env.production.example → infra/gcp/.env.production"
echo "      fill secrets, then run ./infra/gcp/deploy-prod.sh"
