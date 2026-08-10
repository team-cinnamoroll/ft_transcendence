#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

bash "$SCRIPT_DIR/install-osv-scanner.sh"

# dev-container-bootstrap.sh 側の権限修復が完了するまで待機する
echo "Waiting for dev-container-bootstrap.sh to finish permission setup..."
while [ ! -f /tmp/bootstrap_done ]; do
    sleep 1
done
echo "Permission setup complete. Running pnpm install..."

# Avoid interactive consent prompt when Corepack needs to download pnpm.
COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm install
