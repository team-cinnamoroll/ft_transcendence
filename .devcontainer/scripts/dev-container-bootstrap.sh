#!/usr/bin/env bash
set -euo pipefail

docker_sock="/var/run/docker.sock"
node_uid="$(id -u node)"

prepare_docker_group() {
	if [[ ! -S "$docker_sock" ]]; then
		return 0
	fi

	docker_gid="$(stat -c '%g' "$docker_sock")"
	if getent group docker >/dev/null 2>&1; then
		groupmod -o -g "$docker_gid" docker
	else
		groupadd -g "$docker_gid" docker
	fi
	usermod -aG docker node
}

ensure_node_owned_dir() {
	local dir="$1"
	# 過去に root で作られてしまった内部のファイルを確実に修復するため、
	# チェックを省略して強制的に chown -R を実行します。
	chown -R node:node "$dir"
}

prepare_node_dirs() {
	for dir in \
		/home/node/.cache \
		/home/node/.local \
		/home/node/.pnpm-store \
		/workspace/.pnpm-store \
		/workspace/node_modules \
		/workspace/containers/apps/contracts/node_modules \
		/workspace/containers/apps/backend/node_modules \
		/workspace/containers/apps/frontend-bff/node_modules; do
		mkdir -p "$dir"
		ensure_node_owned_dir "$dir"
	done
}

prepare_docker_group
prepare_node_dirs
