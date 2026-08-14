#!/usr/bin/env bash
set -euo pipefail

docker_sock="/var/run/docker.sock"
if [[ -n "${DOCKER_HOST:-}" ]] && [[ "$DOCKER_HOST" == unix://* ]]; then
	docker_sock="${DOCKER_HOST#unix://}"
fi
current_uid="$(id -u)"

if [[ ! -S "$docker_sock" ]]; then
	exit 0
fi

if docker info >/dev/null 2>&1; then
	exit 0
fi

if [[ "$current_uid" -eq 0 ]]; then
	docker_gid="$(stat -L -c '%g' "$docker_sock")"
	if getent group docker >/dev/null 2>&1; then
		groupmod -o -g "$docker_gid" docker
	else
		groupadd -g "$docker_gid" docker
	fi
	exit 0
else
	echo "ERROR: docker.sock is not accessible from the current user. Restart the Dev Container so its bootstrap step can align the docker group before running local CI." >&2
	exit 1
fi
