#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cert_dir="$repo_root/containers/infra/local-prod/certs"

if ! command -v openssl >/dev/null 2>&1; then
  echo "openssl が見つかりません。Dev Container の再ビルド後に再実行してください。" >&2
  exit 1
fi

mkdir -p "$cert_dir"

ca_key="$cert_dir/ca.key"
ca_crt="$cert_dir/ca.crt"
server_key="$cert_dir/tls.key"
server_crt="$cert_dir/tls.crt"

# local-ci 用: ブラウザの信頼ストアへはインストールしない想定。
# local-prod (Full) の mkcert とは別物なので、必要なら mkcert 手順を使うこと。

# 既に揃っている場合は何もしない
if [[ -f "$ca_crt" && -f "$server_crt" && -f "$server_key" ]]; then
  echo "local-ci TLS 資材は既に存在します: $cert_dir" >&2
  exit 0
fi

workdir="$(mktemp -d)"
trap 'rm -rf "$workdir"' EXIT

extfile="$workdir/server.ext"
cat > "$extfile" <<'EOF'
subjectAltName = @alt_names
basicConstraints = CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth

[alt_names]
DNS.1 = tracen.local
DNS.2 = *.tracen.local
EOF

# CA を生成（なければ）
if [[ ! -f "$ca_key" || ! -f "$ca_crt" ]]; then
  echo "[local-ci tls] Generate CA" >&2
  openssl genrsa -out "$ca_key" 4096
  openssl req -x509 -new -nodes -key "$ca_key" \
    -sha256 -days 3650 \
    -subj "/CN=tracen-local-ci-ca" \
    -out "$ca_crt"
  chmod 600 "$ca_key" || true
fi

# サーバ証明書を生成（毎回上書き）
csr="$workdir/server.csr"

echo "[local-ci tls] Generate server cert (tracen.local, *.tracen.local)" >&2
openssl genrsa -out "$server_key" 2048
openssl req -new -key "$server_key" -subj "/CN=tracen.local" -out "$csr"
openssl x509 -req -in "$csr" \
  -CA "$ca_crt" -CAkey "$ca_key" -CAcreateserial \
  -out "$server_crt" -days 825 -sha256 \
  -extfile "$extfile"

chmod 600 "$server_key" || true

cat <<EOF >&2

local-ci 用 TLS 資材を生成しました（openssl, ローカル専用CA）:
- $ca_crt
- $server_crt
- $server_key

注意:
- これはブラウザ/ホストOSへ信頼インストールしません（コンテナ間通信・スモークテスト用）。
- Full(local-prod) の「レジストリTLS・ブラウザ警告なし」まで確認したい場合は mkcert 手順（pnpm local-prod:setup-tls）を使用してください。

EOF
