#!/usr/bin/env bash
# Create develop branch, push to origin, configure GitHub branch rules.
#
# Usage: ./scripts/setup-git-branches.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "")"
if [[ -z "$REPO" ]]; then
  echo "gh repo view failed — are you logged in? (gh auth login)"
  exit 1
fi

echo "==> Repository: $REPO"

# Push main if ahead
if git rev-parse --verify origin/main &>/dev/null; then
  AHEAD="$(git rev-list --count origin/main..HEAD 2>/dev/null || echo 0)"
  if [[ "$AHEAD" -gt 0 ]]; then
    echo "==> Pushing main ($AHEAD commits ahead)"
    git push origin main
  fi
fi

# Create and push develop
if git show-ref --verify --quiet refs/heads/develop; then
  echo "==> Branch develop already exists locally"
else
  git branch develop
  echo "==> Created branch develop from $(git rev-parse --short HEAD)"
fi

git push -u origin develop

echo "==> Configuring branch protection (best-effort)"

protect_branch() {
  local branch="$1"
  local require_pr="${2:-true}"
  echo "    protecting $branch..."
  if [[ "$require_pr" == "true" ]]; then
    gh api -X PUT "repos/${REPO}/branches/${branch}/protection" \
      -H "Accept: application/vnd.github+json" \
      --input - <<'EOF'
{
  "required_status_checks": { "strict": true, "contexts": ["lint-build"] },
  "enforce_admins": false,
  "required_pull_request_reviews": { "required_approving_review_count": 0, "dismiss_stale_reviews": true },
  "restrictions": null
}
EOF
  else
    gh api -X PUT "repos/${REPO}/branches/${branch}/protection" \
      -H "Accept: application/vnd.github+json" \
      --input - <<'EOF'
{
  "required_status_checks": null,
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null
}
EOF
  fi
}

protect_branch main true
protect_branch develop false

echo "==> Creating GitHub Environments (sandbox, production)"
for env in sandbox production; do
  gh api -X PUT "repos/${REPO}/environments/${env}" --input - <<< '{}' 2>/dev/null || \
    echo "    environment $env may already exist"
done

echo ""
echo "==> Git branches ready"
echo "    main    → production (gorumin.com)"
echo "    develop → sandbox (sbx.gorumin.com)"
echo ""
echo "    Feature work: git checkout develop && git pull && git checkout -b feature/..."
