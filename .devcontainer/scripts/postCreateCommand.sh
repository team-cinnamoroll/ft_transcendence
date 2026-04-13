#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

bash "$SCRIPT_DIR/fix-node-modules-perms.sh"

corepack enable

# Avoid interactive consent prompt when Corepack needs to download pnpm.
COREPACK_ENABLE_DOWNLOAD_PROMPT=0 pnpm install
