#!/usr/bin/env bash
# Sync CMS/catalog content against the SANDBOX Cloud SQL database.
#
# Usage:
#   ./infra/gcp/sync-sandbox.sh [--fast|--push|--full]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
export ENV_FILE="${ENV_FILE:-$ROOT/infra/gcp/.env.sandbox}"

exec "$ROOT/infra/gcp/sync-prod.sh" "$@"
