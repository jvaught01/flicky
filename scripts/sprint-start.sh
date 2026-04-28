#!/usr/bin/env bash
# sprint-start.sh — Pre-sprint alignment check
# Usage: bash scripts/sprint-start.sh [sprint-branch] [base-branch]
# Defaults: current branch vs master
set -euo pipefail

SPRINT_BRANCH="${1:-$(git rev-parse --abbrev-ref HEAD)}"
BASE_BRANCH="${2:-master}"

echo "Sprint branch : $SPRINT_BRANCH"
echo "Base branch   : $BASE_BRANCH"
echo ""

# Fetch to ensure base ref reflects remote state
git fetch origin "$BASE_BRANCH" --quiet --prune 2>/dev/null || {
  echo "[WARN] Could not fetch origin/$BASE_BRANCH — comparing against local ref only."
}

AHEAD_COUNT=$(git rev-list --count "$SPRINT_BRANCH".."$BASE_BRANCH")
SPRINT_ONLY=$(git rev-list --count "$BASE_BRANCH".."$SPRINT_BRANCH")
MERGE_BASE=$(git merge-base "$BASE_BRANCH" "$SPRINT_BRANCH")

echo "=== STATUS ==="
if [ "$AHEAD_COUNT" -eq 0 ]; then
  echo "ALIGNED"
  echo "Sprint branch is up to date with $BASE_BRANCH."
  echo "Merge base    : $MERGE_BASE"
  echo "Sprint-only commits: $SPRINT_ONLY"
  exit 0
else
  echo "DIVERGED"
  echo "$BASE_BRANCH has $AHEAD_COUNT commit(s) not present in this sprint branch."
  echo "Sprint-only commits: $SPRINT_ONLY"
  echo "Merge base    : $MERGE_BASE"
  echo ""
  echo "=== COMMITS ON $BASE_BRANCH NOT IN SPRINT ==="
  git log --oneline "$SPRINT_BRANCH".."$BASE_BRANCH"
  echo ""
  echo "=== FILE CHANGES ($BASE_BRANCH vs SPRINT) ==="
  git diff --stat "$SPRINT_BRANCH"..."$BASE_BRANCH"
  exit 1
fi
