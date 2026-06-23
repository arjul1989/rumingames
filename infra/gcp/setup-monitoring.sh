#!/usr/bin/env bash
# Creates log-based metrics for Gorumin monitor events (US-10.3 / RUM-67).
# Usage: ./infra/gcp/setup-monitoring.sh PROJECT_ID [NOTIFICATION_EMAIL]
set -euo pipefail

PROJECT_ID="${1:?Usage: $0 PROJECT_ID [NOTIFICATION_EMAIL]}"
EMAIL="${2:-}"

echo "Creating log-based metrics in project $PROJECT_ID..."

create_metric() {
  local name="$1"
  local description="$2"
  local filter="$3"
  if gcloud logging metrics describe "$name" --project="$PROJECT_ID" &>/dev/null; then
    echo "  skip $name (exists)"
  else
    gcloud logging metrics create "$name" \
      --project="$PROJECT_ID" \
      --description="$description" \
      --log-filter="$filter"
    echo "  created $name"
  fi
}

BASE='jsonPayload.gorumin_monitor=true resource.type="cloud_run_revision" resource.labels.service_name="gorumin-medusa"'

create_metric "gorumin_fulfillment_failed" "Gorumin fulfillment failures" \
  "$BASE AND jsonPayload.event_type=\"fulfillment.failed\""

create_metric "gorumin_mp_webhook_error" "Mercado Pago webhook errors" \
  "$BASE AND jsonPayload.event_type=\"payment.webhook.error\""

create_metric "gorumin_fazer_balance_low" "Fazer low balance" \
  "$BASE AND jsonPayload.event_type=\"fazer.balance.low\""

create_metric "gorumin_health_failed" "Health check failures" \
  "$BASE AND jsonPayload.event_type=\"health.check.failed\""

echo ""
echo "Log-based metrics ready."
echo "Next: create alert policies in Cloud Console → Monitoring → Alerting"
echo "Filter: $BASE"
if [[ -n "$EMAIL" ]]; then
  echo "Suggested notification email: $EMAIL"
fi
echo "See docs/infra/gcp-monitoring.md for uptime check setup."
