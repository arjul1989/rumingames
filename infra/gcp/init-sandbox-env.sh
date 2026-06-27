#!/usr/bin/env bash
# Generate infra/gcp/.env.sandbox from template + random secrets.
# Optionally reuses GCP project settings from .env.production and sandbox
# payment keys from apps/medusa/.env (never printed).
#
# Usage: ./infra/gcp/init-sandbox-env.sh [--force]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TEMPLATE="$ROOT/infra/gcp/env.sandbox.example"
TARGET="$ROOT/infra/gcp/.env.sandbox"
PROD_ENV="$ROOT/infra/gcp/.env.production"
MEDUSA_ENV="$ROOT/apps/medusa/.env"

if [[ -f "$TARGET" && "${1:-}" != "--force" ]]; then
  echo "Already exists: $TARGET (use --force to overwrite secrets)"
  exit 0
fi

cp "$TEMPLATE" "$TARGET"

rand() {
  openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32
}

# Replace change-me placeholders
if [[ "$(uname)" == "Darwin" ]]; then
  SED_INPLACE=(sed -i '')
else
  SED_INPLACE=(sed -i)
fi

"${SED_INPLACE[@]}" "s/^DB_PASSWORD=.*/DB_PASSWORD=$(rand)/" "$TARGET"
"${SED_INPLACE[@]}" "s/^JWT_SECRET=.*/JWT_SECRET=$(rand)/" "$TARGET"
"${SED_INPLACE[@]}" "s/^COOKIE_SECRET=.*/COOKIE_SECRET=$(rand)/" "$TARGET"
"${SED_INPLACE[@]}" "s/^DIGITAL_CODE_ENCRYPTION_KEY=.*/DIGITAL_CODE_ENCRYPTION_KEY=$(rand)$(rand)/" "$TARGET"
"${SED_INPLACE[@]}" "s/^REVALIDATE_SECRET=.*/REVALIDATE_SECRET=$(rand)/" "$TARGET"

copy_env_var() {
  local file="$1" key="$2"
  if [[ -f "$file" ]]; then
    local line
    line="$(grep -E "^${key}=" "$file" 2>/dev/null | tail -1 || true)"
    if [[ -n "$line" && "$line" != *"change-me"* && "$line" != "${key}=" ]]; then
      local value="${line#*=}"
      if [[ "$value" != \"*\" && "$value" == *" "* ]]; then
        line="${key}=\"${value}\""
      fi
      "${SED_INPLACE[@]}" "s|^${key}=.*|${line}|" "$TARGET"
    fi
  fi
}

if [[ -f "$PROD_ENV" ]]; then
  echo "==> Copying GCP project settings from .env.production"
  for key in GCP_PROJECT_ID GCP_REGION AR_REPO; do
    copy_env_var "$PROD_ENV" "$key"
  done
fi

if [[ -f "$MEDUSA_ENV" ]]; then
  echo "==> Copying sandbox payment/integration keys from apps/medusa/.env"
  for key in \
    WOMPI_PUBLIC_KEY WOMPI_PRIVATE_KEY WOMPI_EVENTS_SECRET WOMPI_INTEGRITY_SECRET \
    WOMPI_API_BASE_URL WOMPI_NOTIFICATION_URL \
    EPAYCO_PUBLIC_KEY EPAYCO_PRIVATE_KEY EPAYCO_CONFIRMATION_SECRET EPAYCO_NOTIFICATION_URL \
    MP_ACCESS_TOKEN MP_PUBLIC_KEY MP_WEBHOOK_SECRET \
    FAZER_API_KEY FAZER_BASE_URL FAZER_WEBHOOK_SECRET \
    BREVO_API_KEY BREVO_FROM_EMAIL BREVO_SENDER_NAME BREVO_REPLY_TO ADMIN_ALERT_EMAIL \
    REDIS_URL GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET; do
    copy_env_var "$MEDUSA_ENV" "$key"
  done
  # Sandbox-specific overrides from local dev
  "${SED_INPLACE[@]}" 's|^WOMPI_NOTIFICATION_URL=.*|WOMPI_NOTIFICATION_URL=https://api.sbx.gorumin.com/hooks/wompi|' "$TARGET"
  "${SED_INPLACE[@]}" 's|^EPAYCO_NOTIFICATION_URL=.*|EPAYCO_NOTIFICATION_URL=https://api.sbx.gorumin.com/hooks/epayco|' "$TARGET"
  "${SED_INPLACE[@]}" 's|^MP_NOTIFICATION_URL=.*|MP_NOTIFICATION_URL=https://api.sbx.gorumin.com/hooks/mercadopago|' "$TARGET"
  "${SED_INPLACE[@]}" 's|^EPAYCO_TEST_MODE=.*|EPAYCO_TEST_MODE=true|' "$TARGET"
  "${SED_INPLACE[@]}" 's|^BREVO_SENDER_NAME=.*|BREVO_SENDER_NAME="Gorumin Sandbox"|' "$TARGET"
fi

echo ""
echo "==> Created $TARGET"
echo "    Review payment keys and fill any empty integrations before deploy."
echo "    Next: ./infra/gcp/bootstrap-sandbox.sh && ./infra/gcp/deploy-sandbox.sh"
