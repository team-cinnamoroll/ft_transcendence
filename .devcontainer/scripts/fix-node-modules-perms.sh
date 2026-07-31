#!/usr/bin/env bash
set -euo pipefail

CURRENT_UID="$(id -u)"
CURRENT_GID="$(id -g)"
USER_HOME="${HOME:-/home/node}"
NODE_MODULES_DIR="/workspace/node_modules"

# ディレクトリが存在しない場合、一般権限→sudoの順で作成を試みる
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

# ディレクトリの所有者(UID)が現在のユーザーと異なる場合、または書き込めない場合のみ chown を実行
chown_if_needed() {
	local dir="$1"
	if [ -e "$dir" ]; then
		local owner_uid
		# Linux (stat -c) / macOS (stat -f) 両対応で所有者UIDを取得
		owner_uid="$(stat -c '%u' "$dir" 2>/dev/null || stat -f '%u' "$dir" 2>/dev/null || echo "")"

		# 所有者が自分と異なる、または書き込み不可なら chown を実行
		if [ "$owner_uid" != "$CURRENT_UID" ] || [ ! -w "$dir" ]; then
			if command -v sudo >/dev/null 2>&1; then
				sudo chown -R "${CURRENT_UID}:${CURRENT_GID}" "$dir"
			else
				chown -R "${CURRENT_UID}:${CURRENT_GID}" "$dir"
			fi
		fi
	fi
}

# 1. pnpm/Corepack が使用するキャッシュ・ストアディレクトリの準備と所有権修復
for cache_dir in "$USER_HOME/.cache" "$USER_HOME/.local" "$USER_HOME/.pnpm-store"; do
	mkdir_if_needed "$cache_dir"
	chown_if_needed "$cache_dir"
done

# 2. ワークスペース直下の node_modules の準備と所有権修復
mkdir_if_needed "$NODE_MODULES_DIR"
chown_if_needed "$NODE_MODULES_DIR"

# 3. モノレポ内のすべての node_modules を検出して、必要な場合のみ修復
find /workspace -name "node_modules" -type d -prune 2>/dev/null | while read -r dir; do
	chown_if_needed "$dir"
done
