#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cert_dir="$repo_root/containers/infra/local-prod/certs"

mode="${1:-${TRACEN_LOCAL_PROD_MODE:-fast}}" # fast | full

case "$mode" in
  fast|full) ;;
  *)
    echo "Usage: $0 [fast|full]" >&2
    exit 2
    ;;
esac

# このスクリプトは Dev Container 内から実行される想定です。
# docker-outside-of-docker の場合、compose の bind mount source はホスト側で解決されるため、
# ホストのワークスペース絶対パスから compose を起動できるようにします。
host_ws="${TRACEN_LOCAL_CI_HOST_WORKSPACE:-}"
if [[ -z "$host_ws" ]]; then
  echo "TRACEN_LOCAL_CI_HOST_WORKSPACE が未設定です。Dev Container の remoteEnv で注入してください。" >&2
  exit 1
fi

compose_base="$host_ws/docker-compose.local-prod.yml"
compose_ci_ports="$host_ws/docker-compose.local-prod.ci-ports.yml"

export TRACEN_LOCAL_PROD_PROJECT_NAME="${TRACEN_LOCAL_PROD_PROJECT_NAME:-tracen-local-ci}"
export TRACEN_LOCAL_PROD_MODE="$mode"
export TRACEN_LOCAL_PROD_SMOKE_STRATEGY="${TRACEN_LOCAL_PROD_SMOKE_STRATEGY:-container}"
export TRACEN_LOCAL_PROD_COMPOSE_FILES="$compose_base $compose_ci_ports"

ensure_tls_assets() {
  local missing=""
  for f in ca.crt tls.crt tls.key; do
    if [[ ! -f "$cert_dir/$f" ]]; then
      missing="yes"
      break
    fi
  done

  if [[ "$missing" != "yes" ]]; then
    return 0
  fi

  if [[ "$mode" == "fast" ]]; then
    echo "[local-ci] TLS 資材が不足しています。fast モード用に自動生成します。" >&2
    bash "$repo_root/scripts/setup-local-ci-tls.sh"
    return 0
  fi

  echo "[local-ci] TLS 資材が不足しています: $cert_dir" >&2
  echo "[local-ci] full モードでは mkcert 手順が必要です。ホストOSで次を実行してください:" >&2
  echo "  pnpm local-prod:setup-tls" >&2
  exit 1
}

cleanup() {
  echo "[local-ci] Cleanup (down)"
  # down は失敗しても本体の exit code を優先したいので抑制
  bash "$repo_root/scripts/down-local-prod.sh" || true
}
trap cleanup EXIT INT TERM

echo "[local-ci] Start local-prod (mode=$TRACEN_LOCAL_PROD_MODE, project=$TRACEN_LOCAL_PROD_PROJECT_NAME)"

ensure_tls_assets

bash "$repo_root/scripts/deploy-local-prod.sh"
