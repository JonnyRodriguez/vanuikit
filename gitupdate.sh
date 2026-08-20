#!/bin/bash
set -euo pipefail

readonly MSG=${1:-"update"}
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -n "$(git status --porcelain)" ]; then
  echo "Changes detected, committing and pulling..."
  git add "$SCRIPT_DIR/."
  git commit -m "$MSG"
  git push
else
  echo "No changes detected, nothing to commit."
fi
