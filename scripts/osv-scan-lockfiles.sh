#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v osv-scanner >/dev/null 2>&1; then
  echo "osv-scanner コマンドが見つかりません。Dev Container の再作成後に再実行してください。" >&2
  exit 1
fi

cd "$repo_root"
osv-scanner scan -L pnpm-lock.yaml
