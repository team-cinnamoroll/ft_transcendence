#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
compose_file="$repo_root/docker-compose.local-prod.yml"
project_name="tracen-local-prod"

cd "$repo_root"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker コマンドが見つかりません。" >&2
  exit 1
fi

export TRACEN_IMAGE_TAG="${TRACEN_IMAGE_TAG:-local}"

docker compose -p "$project_name" -f "$compose_file" down --remove-orphans
