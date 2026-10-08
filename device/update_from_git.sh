#!/usr/bin/env bash
# Pull latest code from GitHub on boot (before the listener starts).
# Never exits non-zero for pull failures — old code keeps running.
set -u

ROOT="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$ROOT/.." && pwd)"

cd "$REPO" || exit 0

echo "[update] repo=$REPO"
echo "[update] waiting briefly for network..."
sleep 5

if ! command -v git >/dev/null 2>&1; then
  echo "[update] git not installed — skip"
  exit 0
fi

if [[ ! -d .git ]]; then
  echo "[update] not a git checkout — skip (copy was not git clone)"
  exit 0
fi

# Keep local secrets / untracked files; only update tracked code.
git config --local pull.rebase false >/dev/null 2>&1 || true

BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)"
echo "[update] fetching origin/$BRANCH ..."

if git fetch --depth=1 origin "$BRANCH" 2>&1; then
  if git merge --ff-only "origin/$BRANCH" 2>&1; then
    echo "[update] up to date with origin/$BRANCH ($(git rev-parse --short HEAD))"
  else
    echo "[update] could not fast-forward (local commits/conflicts?) — leaving code as-is"
    git status -sb || true
  fi
else
  echo "[update] fetch failed (offline / auth?) — leaving code as-is"
fi

# Ensure scripts stay executable after pull
chmod +x "$ROOT"/*.sh 2>/dev/null || true

exit 0
