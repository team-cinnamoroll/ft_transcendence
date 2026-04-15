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
chmod 600 "$cert_dir/tls.key" || true

cat <<'EOF'

TLS 資材を生成しました:
- containers/infra/local-prod/certs/tls.crt
- containers/infra/local-prod/certs/tls.key
- containers/infra/local-prod/certs/ca.crt

次の 1回だけのセットアップが必要です:
1) /etc/hosts に以下を追加
   127.0.0.1 tracen.local registry.tracen.local

2) Docker が registry.tracen.local:5000 のTLSを信頼できるように CA を配置
   sudo mkdir -p /etc/docker/certs.d/registry.tracen.local:5000
  sudo cp containers/infra/local-prod/certs/ca.crt /etc/docker/certs.d/registry.tracen.local:5000/ca.crt

EOF
