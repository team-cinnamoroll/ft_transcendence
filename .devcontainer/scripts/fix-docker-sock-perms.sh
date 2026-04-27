#!/usr/bin/env bash
set -euo pipefail

docker_sock="/var/run/docker.sock"

if [[ ! -S "$docker_sock" ]]; then
	exit 0
fi

current_group="$(stat -c '%G' "$docker_sock")"
if [[ "$current_group" == "docker" ]]; then
	exit 0
fi

if command -v sudo >/dev/null 2>&1; then
	sudo chown root:docker "$docker_sock"
else
	chown root:docker "$docker_sock"
fi
