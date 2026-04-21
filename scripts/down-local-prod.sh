#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
default_compose_file="$repo_root/docker-compose.local-prod.yml"
project_name="${TRACEN_LOCAL_PROD_PROJECT_NAME:-tracen-local-prod}"
env_file="$repo_root/.env.local-prod"

compose_files=()
if [[ -n "${TRACEN_LOCAL_PROD_COMPOSE_FILES:-}" ]]; then
  # shellcheck disable=SC2206
  compose_files=(${TRACEN_LOCAL_PROD_COMPOSE_FILES})
else
  compose_files=("$default_compose_file")
fi

cd "$repo_root"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker コマンドが見つかりません。" >&2
  exit 1
fi

export TRACEN_IMAGE_TAG="${TRACEN_IMAGE_TAG:-local}"

compose_cmd=(docker compose -p "$project_name")
if [[ -f "$env_file" ]]; then
  compose_cmd+=( --env-file "$env_file" )
fi
for f in "${compose_files[@]}"; do
  if [[ -f "$f" ]]; then
    compose_cmd+=( -f "$f" )
  fi
done

"${compose_cmd[@]}" down --remove-orphans
