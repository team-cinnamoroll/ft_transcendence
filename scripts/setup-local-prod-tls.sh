#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cert_dir="$repo_root/containers/infra/local-prod/certs"

if ! command -v mkcert >/dev/null 2>&1; then
  echo "mkcert が見つかりません。ホストOSに mkcert をインストールしてから実行してください。" >&2
  exit 1
fi

mkdir -p "$cert_dir"

mkcert \
  -cert-file "$cert_dir/tls.crt" \
  -key-file "$cert_dir/tls.key" \
  tracen.local \
  "*.tracen.local"

caroot="$(mkcert -CAROOT)"
if [[ ! -f "$caroot/rootCA.pem" ]]; then
  echo "mkcert の rootCA.pem が見つかりません: $caroot/rootCA.pem" >&2
  echo "mkcert -install を実行済みか確認してください。" >&2
  exit 1
fi

cp "$caroot/rootCA.pem" "$cert_dir/ca.crt"
# 秘密鍵はホスト側では 600 のままでよい。
# ELK(非 root, uid 1000)には elk-certs-init が volume に複製して所有者を揃えるため、
# ホストの uid や OS(macOS/Linux)の違いによらず読める。
chmod 600 "$cert_dir/tls.key" || true

echo "TLS 資材を生成しました:"
echo "- containers/infra/local-prod/certs/tls.crt"
echo "- containers/infra/local-prod/certs/tls.key"
echo "- containers/infra/local-prod/certs/ca.crt"
echo ""

echo "Checking /etc/hosts configuration..."
if ! grep -q "tracen.local" /etc/hosts; then
  echo "Adding tracen.local to /etc/hosts (requires sudo)..."
  echo "127.0.0.1 tracen.local registry.tracen.local api.tracen.local kibana.tracen.local" | sudo tee -a /etc/hosts >/dev/null
else
  echo "/etc/hosts is already configured."
fi

echo ""
echo "Checking Docker registry CA configuration..."
DOCKER_CERTS_DIR="/etc/docker/certs.d/registry.tracen.local:5000"
if [[ "$OSTYPE" == "darwin"* ]]; then
  DOCKER_CERTS_DIR="${HOME}/.config/docker/certs.d/registry.tracen.local:5000"
fi

if [[ ! -f "$DOCKER_CERTS_DIR/ca.crt" ]]; then
  echo "Configuring Docker CA at $DOCKER_CERTS_DIR ..."
  if [[ "$DOCKER_CERTS_DIR" == "/etc/docker"* ]]; then
    echo "(requires sudo)"
    sudo mkdir -p "$DOCKER_CERTS_DIR"
    sudo cp "$cert_dir/ca.crt" "$DOCKER_CERTS_DIR/ca.crt"
  else
    mkdir -p "$DOCKER_CERTS_DIR"
    cp "$cert_dir/ca.crt" "$DOCKER_CERTS_DIR/ca.crt"
  fi
else
  echo "Docker CA is already configured at $DOCKER_CERTS_DIR/ca.crt"
fi
