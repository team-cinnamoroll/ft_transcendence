#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

bash "$SCRIPT_DIR/install-osv-scanner.sh"

echo "Running pnpm install..."
# Avoid interactive consent prompt when Corepack needs to download pnpm.
COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm install || {
    echo "============================================================"
    echo "❌ pnpm install failed!"
    echo "============================================================"
    exit 1
}
echo "Setup complete! Ready to start."
