#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
compose_file="$repo_root/docker-compose.local-prod.yml"
project_name="tracen-local-prod"
cert_dir="$repo_root/infra/local-prod/certs"

cd "$repo_root"

if [[ ! -f "$compose_file" ]]; then
  echo "Compose ファイルが見つかりません: $compose_file" >&2
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

if ! getent hosts tracen.local >/dev/null 2>&1; then
  echo "警告: tracen.local が名前解決できません。/etc/hosts に 127.0.0.1 tracen.local を追加してください。" >&2
fi

if ! getent hosts registry.tracen.local >/dev/null 2>&1; then
  echo "警告: registry.tracen.local が名前解決できません。/etc/hosts に 127.0.0.1 registry.tracen.local を追加してください。" >&2
fi

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
  echo "警告: Docker の registry CA 設定が見つかりません。push/pull で TLS エラーになる場合は README の手順 3 を確認してください。" >&2
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

echo "[1/5] Start local registry (https://registry.tracen.local:5000)"
docker compose -p "$project_name" -f "$compose_file" up -d registry

echo "[2/5] Build images ($TRACEN_IMAGE_TAG)"
docker compose -p "$project_name" -f "$compose_file" build backend frontend

echo "[3/5] Push images to local registry"
docker compose -p "$project_name" -f "$compose_file" push backend frontend

echo "[4/5] Start services"
docker compose -p "$project_name" -f "$compose_file" up -d --remove-orphans

echo "[5/5] Smoke test"
if command -v curl >/dev/null 2>&1; then
  ok_api=""
  ok_root=""
  for _ in {1..30}; do
    if [[ "$ok_api" != "yes" ]]; then
      if curl -fsS --cacert "$cert_dir/ca.crt" "https://tracen.local/api/hello" >/dev/null; then
        ok_api="yes"
      fi
    fi

    if [[ "$ok_root" != "yes" ]]; then
      if curl -fsS --cacert "$cert_dir/ca.crt" "https://tracen.local/" >/dev/null; then
        ok_root="yes"
      fi
    fi

    if [[ "$ok_api" == "yes" && "$ok_root" == "yes" ]]; then
      break
    fi
    sleep 0.5
  done

  if [[ "$ok_api" != "yes" || "$ok_root" != "yes" ]]; then
    echo "スモークテストに失敗しました。ログを確認してください:" >&2
    if [[ "$ok_api" != "yes" ]]; then
      echo "- NG: https://tracen.local/api/hello" >&2
    fi
    if [[ "$ok_root" != "yes" ]]; then
      echo "- NG: https://tracen.local/" >&2
    fi
    echo "docker compose -p $project_name -f $compose_file logs --tail=200" >&2
    exit 1
  fi

  echo "OK: https://tracen.local"
  echo "OK: https://tracen.local/api/hello"
else
  echo "curl が無いためスモークテストをスキップしました。" >&2
  echo "ブラウザで https://tracen.local を開いて確認してください。" >&2
fi
