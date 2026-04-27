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

bash "$repo_root/.devcontainer/scripts/fix-docker-sock-perms.sh"

# CI/Dev Container 環境では、ホスト（例: Docker Desktop / OrbStack）の DNS/CA 設定に依存すると
# `registry.tracen.local` の解決や CA 信頼で失敗しやすい。
# そのため DinD を立てて、その Docker daemon に対して build/push する。
dev_project_name="${TRACEN_LOCAL_CI_DEV_PROJECT_NAME:-$(basename "$host_ws")}"
outer_compose_file="$host_ws/docker-compose.dev.yml"
ci_docker_host="${TRACEN_LOCAL_CI_DOCKER_HOST:-tcp://ci-docker:2375}"

start_ci_docker() {
  if [[ ! -f "$outer_compose_file" ]]; then
    echo "[local-ci] dev compose が見つかりません: $outer_compose_file" >&2
    exit 1
  fi

  echo "[local-ci] Start DinD (service=ci-docker, project=$dev_project_name)" >&2

  # outer docker（devcontainer を起動している側）に対して ci-docker を起動する
  (unset DOCKER_HOST; docker compose -p "$dev_project_name" -f "$outer_compose_file" up -d --force-recreate ci-docker) >/dev/null

  echo "[local-ci] Wait for DinD daemon ($ci_docker_host)" >&2
  for _ in $(seq 1 30); do
    if DOCKER_HOST="$ci_docker_host" docker info >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done

  echo "[local-ci] DinD daemon が起動しませんでした: $ci_docker_host" >&2
  exit 1
}

inner_ws="${TRACEN_LOCAL_CI_INNER_WORKSPACE:-/workspace}"
if [[ ! -f "$inner_ws/docker-compose.local-prod.yml" ]]; then
  inner_ws="$repo_root"
fi

compose_base="$inner_ws/docker-compose.local-prod.yml"
compose_ci_ports="$inner_ws/docker-compose.local-prod.ci-ports.yml"

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

  if [[ "$mode" == "full" ]]; then
    echo "[local-ci] TLS 資材が不足しています。full モード用に自動生成します。" >&2
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

  if [[ "${TRACEN_LOCAL_CI_KEEP_DIND:-}" != "1" ]]; then
    echo "[local-ci] Stop DinD (service=ci-docker)" >&2
    (unset DOCKER_HOST; docker compose -p "$dev_project_name" -f "$outer_compose_file" stop ci-docker) >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

echo "[local-ci] Start local-prod (mode=$TRACEN_LOCAL_PROD_MODE, project=$TRACEN_LOCAL_PROD_PROJECT_NAME)"

ensure_tls_assets

start_ci_docker
export DOCKER_HOST="$ci_docker_host"

bash "$repo_root/scripts/deploy-local-prod.sh"
