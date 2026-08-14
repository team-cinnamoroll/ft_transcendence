#!/usr/bin/env bash
set -euo pipefail

docker_sock="/var/run/docker.sock"

prepare_docker_group() {
	if [[ ! -S "$docker_sock" ]]; then
		return 0
	fi

	docker_gid="$(stat -L -c '%g' "$docker_sock")"
	if getent group docker >/dev/null 2>&1; then
		groupmod -o -g "$docker_gid" docker
	else
		groupadd -g "$docker_gid" docker
	fi
	# VS Code will run as root, so we don't strictly need this, but we'll add root to docker group just in case
	usermod -aG docker root || true
}

prepare_node_dirs() {
	local file_storage_dir="/app/uploads"
	if [ -f "/workspace/.env.dev" ]; then
		local env_val="$(grep '^FILE_STORAGE_BASE_DIR=' "/workspace/.env.dev" | head -n 1 | cut -d '=' -f 2- | tr -d '\r')"
		if [ -n "$env_val" ]; then
			file_storage_dir="$env_val"
		fi
	fi

	for dir in \
		/workspace/.pnpm-store \
		/workspace/node_modules \
		/workspace/containers/apps/contracts/node_modules \
		/workspace/containers/apps/backend/node_modules \
		/workspace/containers/apps/frontend-bff/node_modules \
		"$file_storage_dir"; do
		mkdir -p "$dir"
	done
}

prepare_docker_group
prepare_node_dirs

