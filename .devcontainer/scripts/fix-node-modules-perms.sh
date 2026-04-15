#!/usr/bin/env bash
set -euo pipefail

NODE_MODULES_DIR="/workspace/node_modules"
CURRENT_UID="$(id -u)"
CURRENT_GID="$(id -g)"

mkdir_if_needed() {
	local dir="$1"
	if [ -d "$dir" ]; then
		return 0
	fi

	mkdir -p "$dir" 2>/dev/null || {
		if command -v sudo >/dev/null 2>&1; then
			sudo mkdir -p "$dir"
		else
			echo "ERROR: sudo not found; cannot create $dir" >&2
			exit 1
		fi
	}
}

chown_recursive() {
	local dir="$1"
	if command -v sudo >/dev/null 2>&1; then
		sudo chown -R "${CURRENT_UID}:${CURRENT_GID}" "$dir"
	else
		chown -R "${CURRENT_UID}:${CURRENT_GID}" "$dir"
	fi
}

mkdir_if_needed "$NODE_MODULES_DIR"

NEEDS_FIX=0

if [ ! -w "$NODE_MODULES_DIR" ]; then
	NEEDS_FIX=1
fi

if [ -d "${NODE_MODULES_DIR}/.pnpm" ] && [ ! -w "${NODE_MODULES_DIR}/.pnpm" ]; then
	NEEDS_FIX=1
fi

if [ "$NEEDS_FIX" -eq 1 ]; then
	chown_recursive "$NODE_MODULES_DIR"
fi
