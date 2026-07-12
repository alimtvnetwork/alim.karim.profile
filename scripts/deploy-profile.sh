#!/usr/bin/env bash
# Deploy the public profile (README + markdown) to a target folder
# (typically a clone of the GitHub profile repo, e.g. aukgit/aukgit),
# respecting .deployignore.
#
# Usage:
#   scripts/deploy-profile.sh <target-dir>
#
# Env:
#   SKIP_LINK_CHECK=1  to skip `bun run check:links`
set -euo pipefail

TARGET="${1:-}"
if [[ -z "$TARGET" ]]; then
  echo "usage: $0 <target-dir>" >&2
  exit 2
fi
if [[ ! -d "$TARGET" ]]; then
  echo "target '$TARGET' does not exist" >&2
  exit 2
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"
TARGET="$(cd "$TARGET" && pwd)"

IGNORE_FILE="$REPO_ROOT/.deployignore"
[[ -f "$IGNORE_FILE" ]] || { echo ".deployignore missing" >&2; exit 1; }

# Load patterns (strip comments / blanks)
mapfile -t PATTERNS < <(grep -Ev '^\s*(#|$)' "$IGNORE_FILE" | sed 's/[[:space:]]*$//')

is_ignored() {
  local p="${1//\\//}"
  local pat
  for pat in "${PATTERNS[@]}"; do
    local g="${pat//\\//}"
    # shellcheck disable=SC2053
    [[ "$p" == $g ]] && return 0
    if [[ "$g" == \*\*/* ]]; then
      local rest="${g#**/}"
      # shellcheck disable=SC2053
      [[ "$p" == $rest || "$p" == */$rest ]] && return 0
    fi
  done
  return 1
}

if [[ "${SKIP_LINK_CHECK:-0}" != "1" ]] && [[ -f package.json ]] && grep -q '"check:links"' package.json; then
  echo "[1/3] Link check..."
  bun run check:links
fi

echo "[2/3] Copying files to $TARGET ..."
COUNT=0
while IFS= read -r -d '' file; do
  rel="${file#./}"
  if is_ignored "$rel"; then continue; fi
  if [[ "$rel" == .git/* ]]; then continue; fi
  dest="$TARGET/$rel"
  mkdir -p "$(dirname "$dest")"
  cp -f "$file" "$dest"
  COUNT=$((COUNT+1))
done < <(find . -type f -not -path './.git/*' -print0)

echo "[3/3] Copied $COUNT files."
