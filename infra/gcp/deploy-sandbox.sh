#!/usr/bin/env bash
# Deploy Gorumin to Cloud Run SANDBOX (sbx.gorumin.com).
#
# Prerequisites:
#   1. ./infra/gcp/bootstrap-sandbox.sh
#   2. cp infra/gcp/env.sandbox.example infra/gcp/.env.sandbox  (fill values)
#   3. gcloud auth login && docker running
#
# Usage:
#   ./infra/gcp/deploy-sandbox.sh [both|medusa|storefront]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
export ENV_FILE="${ENV_FILE:-$ROOT/infra/gcp/.env.sandbox}"

exec "$ROOT/infra/gcp/deploy-prod.sh" "${1:-both}"
