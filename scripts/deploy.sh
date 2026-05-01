#!/usr/bin/env bash
# Deploy script — runs on the server, idempotent.
#
# Triggered automatically every 2 minutes by systemd timer (portfolio-deploy.timer).
# Can also be run manually:  bash scripts/deploy.sh main
#
# Pulls the latest commit on the given branch (default `main`).
# If there are new commits OR a pending state file, it:
#   1. Installs npm deps if package-lock changed
#   2. Pushes the Prisma schema if it changed
#   3. Re-builds the Next.js app
#   4. Restarts the systemd service

set -euo pipefail

BRANCH="${1:-main}"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOCKFILE="/tmp/portfolio-deploy.lock"

cd "$APP_DIR"

# Prevent overlapping deploys
exec 9>"$LOCKFILE"
flock -n 9 || { echo "another deploy is already running"; exit 0; }

CURRENT="$(git rev-parse HEAD)"

git fetch --quiet origin "$BRANCH"
TARGET="$(git rev-parse "origin/$BRANCH")"

if [[ "$CURRENT" == "$TARGET" ]]; then
  exit 0  # nothing to do — silent success so the timer log stays clean
fi

echo ""
echo "=== Deploy started $(date -u +%FT%TZ) ==="
echo "  $CURRENT  ->  $TARGET"
echo ""

# Detect what changed so we only re-run what's needed
CHANGED="$(git diff --name-only "$CURRENT" "$TARGET" || true)"

git reset --hard "$TARGET"
git clean -fd

NEED_NPM_CI=0
NEED_PRISMA=0
if echo "$CHANGED" | grep -qE '^(package(-lock)?\.json|prisma/schema\.prisma)$'; then
  NEED_NPM_CI=1
fi
if echo "$CHANGED" | grep -qE '^prisma/schema\.prisma$'; then
  NEED_PRISMA=1
fi

if [[ $NEED_NPM_CI -eq 1 ]]; then
  echo "→ installing dependencies"
  npm ci --no-audit --no-fund
fi

if [[ $NEED_PRISMA -eq 1 ]]; then
  echo "→ syncing Prisma schema"
  npx prisma generate
  npx prisma db push --accept-data-loss
fi

echo "→ building"
npm run build

echo "→ restarting service"
sudo /bin/systemctl restart portfolio.service

echo ""
echo "=== Deploy done $(date -u +%FT%TZ) ==="
