#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
default_compose_file="$repo_root/docker-compose.local-prod.yml"
project_name="${TRACEN_LOCAL_PROD_PROJECT_NAME:-tracen-local-prod}"
cert_dir="$repo_root/containers/infra/local-prod/certs"
env_file="$repo_root/.env.local-prod"

mode="${TRACEN_LOCAL_PROD_MODE:-full}" # full | fast

default_smoke_strategy="host"
if [[ -f /.dockerenv ]]; then
  # Dev Container や CI コンテナ内では、ホストにポート公開しても 127.0.0.1 で到達できないことが多い。
  default_smoke_strategy="container"
fi
if [[ -n "${DOCKER_HOST:-}" && "${DOCKER_HOST:-}" != unix:///var/run/docker.sock ]]; then
  default_smoke_strategy="container"
fi

smoke_strategy="${TRACEN_LOCAL_PROD_SMOKE_STRATEGY:-$default_smoke_strategy}" # host | container
smoke_max_time="${TRACEN_LOCAL_PROD_SMOKE_MAX_TIME:-3}"
smoke_attempts="${TRACEN_LOCAL_PROD_SMOKE_ATTEMPTS:-30}"

compose_files=()
if [[ -n "${TRACEN_LOCAL_PROD_COMPOSE_FILES:-}" ]]; then
  # shellcheck disable=SC2206
  compose_files=(${TRACEN_LOCAL_PROD_COMPOSE_FILES})
else
  compose_files=("$default_compose_file")
fi

cd "$repo_root"

for f in "${compose_files[@]}"; do
  if [[ ! -f "$f" ]]; then
    echo "Compose ファイルが見つかりません: $f" >&2
    exit 1
  fi
done

if [[ ! -f "$env_file" ]]; then
  echo "環境変数ファイルが見つかりません: $env_file" >&2
  echo "次を作成してください: cp .env.local-prod.example .env.local-prod" >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker コマンドが見つかりません。ホストOSに Docker をインストールしてください。" >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "docker compose が利用できません。Docker Compose v2 を使用してください。" >&2
  exit 1
fi

for f in ca.crt tls.crt tls.key; do
  if [[ ! -f "$cert_dir/$f" ]]; then
    echo "TLS 資材が不足しています: $cert_dir/$f" >&2
    echo "先に次を実行してください: bash scripts/setup-local-prod-tls.sh" >&2
    exit 1
  fi
done

if [[ "$smoke_strategy" != "container" ]]; then
  if ! getent hosts tracen.local >/dev/null 2>&1; then
    echo "警告: tracen.local が名前解決できません。/etc/hosts に 127.0.0.1 tracen.local を追加してください。" >&2
  fi
fi

if [[ "$mode" == "full" ]]; then
  if ! getent hosts registry.tracen.local >/dev/null 2>&1; then
    echo "警告: registry.tracen.local が名前解決できません。/etc/hosts に 127.0.0.1 registry.tracen.local を追加してください。" >&2
  fi
fi

if [[ "$mode" == "full" && ! -f /.dockerenv ]]; then
  docker_ca_installed=""
  for p in \
    "/etc/docker/certs.d/registry.tracen.local:5000/ca.crt" \
    "${HOME:-}/.config/docker/certs.d/registry.tracen.local:5000/ca.crt"; do
    if [[ -n "$p" && -f "$p" ]]; then
      docker_ca_installed="yes"
      break
    fi
  done

  if [[ "$docker_ca_installed" != "yes" ]]; then
    echo "警告: Docker の registry CA 設定が見つかりません。push/pull で TLS エラーになる場合は README の『Docker がローカルレジストリの TLS を信頼するように設定』を確認してください。" >&2
  fi
fi

tag=""
if command -v git >/dev/null 2>&1 && git -C "$repo_root" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  tag="$(git -C "$repo_root" rev-parse --short HEAD)"
  if ! git -C "$repo_root" diff --quiet; then
    tag="${tag}-dirty"
  fi
else
  tag="$(date +%Y%m%d%H%M%S)"
fi

export TRACEN_IMAGE_TAG="$tag"
echo "TRACEN_IMAGE_TAG=$TRACEN_IMAGE_TAG" > "$repo_root/.env.local-prod.local"

compose_cmd=(docker compose --env-file "$env_file" -p "$project_name")
for f in "${compose_files[@]}"; do
  compose_cmd+=( -f "$f" )
done

if [[ "$mode" == "full" ]]; then
  echo "[1/5] Start local registry (https://registry.tracen.local:5000)"
  "${compose_cmd[@]}" up -d registry
else
  echo "[1/5] Skip registry (mode=$mode)"
fi

echo "[2/5] Build images ($TRACEN_IMAGE_TAG)"
"${compose_cmd[@]}" build backend frontend

if [[ "$mode" == "full" ]]; then
  echo "[3/5] Push images to local registry"
  "${compose_cmd[@]}" push backend frontend
else
  echo "[3/5] Skip push (mode=$mode)"
fi

echo "[4/5] Start services"
if [[ "$mode" == "full" ]]; then
  "${compose_cmd[@]}" up -d --remove-orphans
else
  # fast では registry を起動しない（起動確認のスコープ外・ホスト競合も避けたい）
  "${compose_cmd[@]}" up -d --remove-orphans db backend frontend nginx
fi

echo "[5/5] Smoke test"
if [[ "$smoke_strategy" == "container" ]]; then
  echo "Smoke strategy: container (network=${project_name}_local-prod)" >&2
  if ! docker image inspect curlimages/curl:latest >/dev/null 2>&1; then
    echo "Pull curl image (curlimages/curl:latest) ..." >&2
    docker pull curlimages/curl:latest >/dev/null
  fi

  container_curl() {
    local url="$1"
    cat "$cert_dir/ca.crt" \
      | docker run -i --rm --network "${project_name}_local-prod" curlimages/curl:latest \
          sh -lc "cat > /tmp/ca.crt && curl -fsS --connect-timeout ${smoke_max_time} --max-time ${smoke_max_time} --cacert /tmp/ca.crt '$url'"
  }

  container_curl_debug() {
    local url="$1"
    cat "$cert_dir/ca.crt" \
      | docker run -i --rm --network "${project_name}_local-prod" curlimages/curl:latest \
          sh -lc "cat > /tmp/ca.crt && curl -vk --connect-timeout ${smoke_max_time} --max-time ${smoke_max_time} --cacert /tmp/ca.crt '$url' >/dev/null"
  }
fi

if [[ "$smoke_strategy" == "container" ]] || command -v curl >/dev/null 2>&1; then
  ok_api=""
  ok_root=""
  for _ in $(seq 1 "$smoke_attempts"); do
    printf '.' >&2
    if [[ "$ok_api" != "yes" ]]; then
      if [[ "$smoke_strategy" == "container" ]]; then
        if container_curl "https://tracen.local/api/health" >/dev/null 2>/dev/null; then
          ok_api="yes"
        fi
      else
        if curl -fsS --connect-timeout "$smoke_max_time" --max-time "$smoke_max_time" --cacert "$cert_dir/ca.crt" "https://tracen.local/api/health" >/dev/null 2>/dev/null; then
          ok_api="yes"
        fi
      fi
    fi

    if [[ "$ok_root" != "yes" ]]; then
      if [[ "$smoke_strategy" == "container" ]]; then
        if container_curl "https://tracen.local/" >/dev/null 2>/dev/null; then
          ok_root="yes"
        fi
      else
        if curl -fsS --connect-timeout "$smoke_max_time" --max-time "$smoke_max_time" --cacert "$cert_dir/ca.crt" "https://tracen.local/" >/dev/null 2>/dev/null; then
          ok_root="yes"
        fi
      fi
    fi

    if [[ "$ok_api" == "yes" && "$ok_root" == "yes" ]]; then
      break
    fi
    sleep 0.5
  done

  echo >&2

  if [[ "$ok_api" != "yes" || "$ok_root" != "yes" ]]; then
    echo "スモークテストに失敗しました。ログを確認してください:" >&2
    if [[ "$ok_api" != "yes" ]]; then
      echo "- NG: https://tracen.local/api/health" >&2
    fi
    if [[ "$ok_root" != "yes" ]]; then
      echo "- NG: https://tracen.local/" >&2
    fi

    echo "curl のエラー詳細:" >&2
    if [[ "$ok_api" != "yes" ]]; then
      if [[ "$smoke_strategy" == "container" ]]; then
        container_curl_debug "https://tracen.local/api/health" || true
      else
        curl -fsS --connect-timeout "$smoke_max_time" --max-time "$smoke_max_time" --cacert "$cert_dir/ca.crt" "https://tracen.local/api/health" >/dev/null || true
      fi
    fi
    if [[ "$ok_root" != "yes" ]]; then
      if [[ "$smoke_strategy" == "container" ]]; then
        container_curl_debug "https://tracen.local/" || true
      else
        curl -fsS --connect-timeout "$smoke_max_time" --max-time "$smoke_max_time" --cacert "$cert_dir/ca.crt" "https://tracen.local/" >/dev/null || true
      fi
    fi

    echo "compose logs (tail=200):" >&2
    "${compose_cmd[@]}" logs --tail=200 || true
    exit 1
  fi

  echo "OK: https://tracen.local"
  echo "OK: https://tracen.local/api/health"
else
  echo "curl が無いためスモークテストをスキップしました。" >&2
  echo "ブラウザで https://tracen.local を開いて確認してください。" >&2
fi
