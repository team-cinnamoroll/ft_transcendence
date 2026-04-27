#!/usr/bin/env bash
set -euo pipefail

version="${OSV_SCANNER_VERSION:-}"
if [[ -z "$version" ]]; then
  version="$(curl -fsSL https://api.github.com/repos/google/osv-scanner/releases/latest | jq -r '.tag_name')"
fi

case "$(uname -m)" in
  x86_64|amd64)
    arch="amd64"
    ;;
  aarch64|arm64)
    arch="arm64"
    ;;
  *)
    echo "Unsupported architecture for osv-scanner: $(uname -m)" >&2
    exit 1
    ;;
esac

asset_name="osv-scanner_linux_${arch}"
base_url="https://github.com/google/osv-scanner/releases/download/${version}"
tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

curl -fsSL -o "$tmpdir/$asset_name" "$base_url/$asset_name"
curl -fsSL -o "$tmpdir/osv-scanner_SHA256SUMS" "$base_url/osv-scanner_SHA256SUMS"

(
  cd "$tmpdir"
  grep "  ${asset_name}$" osv-scanner_SHA256SUMS | sha256sum -c -
)

sudo install -m 0755 "$tmpdir/$asset_name" /usr/local/bin/osv-scanner
osv-scanner --version
