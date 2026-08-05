#!/usr/bin/env bash
set -euo pipefail

CURRENT_UID="$(id -u)"
CURRENT_GID="$(id -g)"
USER_HOME="${HOME:-/home/node}"
NODE_MODULES_DIR="/workspace/node_modules"
RUNNING_AS_ROOT=0

if [[ "$CURRENT_UID" -eq 0 ]]; then
	RUNNING_AS_ROOT=1
fi

# ディレクトリが存在しない場合、root なら作成し、非 root なら失敗を明示する
mkdir_if_needed() {
	local dir="$1"
	if [ -d "$dir" ]; then
		return 0
	fi

	if [[ "$RUNNING_AS_ROOT" -eq 1 ]]; then
		mkdir -p "$dir"
		return 0
	fi

	echo "ERROR: $dir is missing and this container is not running as root. Restart the Dev Container so the bootstrap step can recreate it." >&2
	exit 1
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
			if [[ "$RUNNING_AS_ROOT" -eq 1 ]]; then
				chown -R "${CURRENT_UID}:${CURRENT_GID}" "$dir"
			else
				echo "ERROR: $dir is not writable and this container is not running as root. Restart the Dev Container to refresh its volume ownership." >&2
				exit 1
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
