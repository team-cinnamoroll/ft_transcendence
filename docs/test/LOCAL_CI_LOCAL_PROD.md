# ローカルCI: Dev Container 内で local-prod を回す（Fast / Full）

このドキュメントでは、開発中の変更で **本番相当（local-prod）デプロイが壊れていないか** を早期検知するために、VS Code Dev Container 内から local-prod（HTTPS + nginx + frontend-bff + backend + db）を起動し、スモークテストまでを **1コマンドで実行→必ず後片付け（down）** する仕組みを説明します。

対象:

- 実行者: 開発者（ローカル環境）
- 実行場所: VS Code Dev Container（`dev-container`）内のターミナル
- 実行対象: `docker-compose.local-prod.yml`（本番相当）

---

## 目的（何を検知したいか）

このローカルCIの目的は「開発中の変更が local-prod デプロイに与える影響」を早く見つけることです。

具体的には次の破壊を検知します。

- Dockerfile の build が通らない（依存解決 / build ステップの崩壊）
- 起動しない（環境変数 / TLS / ポート / プロセス起動の崩壊）
- nginx 経由の導線が通らない
- BFF → backend の HTTPS 呼び出し（CA 信頼）が壊れている
- backend → DB の疎通やマイグレーションが壊れている

---

## テスト範囲（何を確認するか）

スモークテストは `https://tracen.local/api/health` を必須とします。

- `GET /api/health` は frontend-bff（Next.js）の Route Handler で、内部的に backend を呼び出して DB を含むチェックを行います
  - 実装: [containers/apps/frontend-bff/src/app/api/health/route.ts](../../containers/apps/frontend-bff/src/app/api/health/route.ts)
  - ロジック: [containers/apps/frontend-bff/src/server/usecases/health.ts](../../containers/apps/frontend-bff/src/server/usecases/health.ts)

このエンドポイントは、概ね次を確認します（将来変わる可能性あり）。

- backend `GET /health`
- backend の users API を使った作成→取得→削除→削除確認
  - これにより backend → DB の疎通（＋マイグレーション影響）も間接的に確認できます

加えて、`https://tracen.local/`（トップページ）が取得できることも確認します。

---

## 実行モード（Fast / Full）

### Fast（高頻度向け）

- 目的: 開発中に何度も回す
- 内容: build + up + smoke + down
- 省略: registry 起動 / push

コマンド:

```bash
pnpm local-ci:fast
```

### Full（忠実度重視）

- 目的: 1日1回、または手動で「レジストリ込み」を確認したい時
- 内容: registry 起動 + build + push + up + smoke + down

コマンド:

```bash
pnpm local-ci:full
```

---

## 実行方法（共通）

前提（最低限）:

- VS Code Dev Container でこのリポジトリを開いている
- `containers/infra/local-prod/certs/` に TLS 資材がある（`ca.crt`, `tls.crt`, `tls.key`）
  - Full 用（推奨）: `pnpm local-prod:setup-tls`（ホストOSで `mkcert` が必要）
  - Fast 用（自動）: `pnpm local-ci:fast` 実行時に不足していれば `openssl` で自動生成します（ローカルCI専用CA）

実行:

1. Dev Container 内のターミナルを開く
2. `pnpm local-ci:fast` もしくは `pnpm local-ci:full` を実行
3. 終了時に、成功/失敗にかかわらず自動で `down` が走ります

---

## 重要な注意点

### 1) docker-outside-of-docker（権限が強い）

このローカルCIは Dev Container からホストの Docker を操作します。

- 仕組み: `/var/run/docker.sock` を Dev Container にマウントして `docker`/`docker compose` を実行
- 影響: Dev Container 内プロセスがホスト Docker を広範に操作できる（= 強い権限）

チームのポリシー上、これが許容できない場合は採用しないでください（代替として dind 等がありますが、構成が重くなります）。

### 2) compose の bind mount パスは「ホスト側で解決」される

Dev Container からホスト Docker を操作するとき、compose の `volumes: - ./path:/...` の `./path` は **ホスト側のカレントディレクトリ** で解決されます。

このため `local-ci` はホストのワークスペース絶対パス（`TRACEN_LOCAL_CI_HOST_WORKSPACE`）を使って compose を起動します。

### 3) CI用途では nginx の公開ポートを変更する

ローカル環境では `443`/`80` が他プロセスと衝突しやすいため、`local-ci` 実行時は nginx の公開ポートを次に変更します。

- HTTP: `8081:80`
- HTTPS: `8443:443`

定義: [docker-compose.local-prod.ci-ports.yml](../../docker-compose.local-prod.ci-ports.yml)

注意:

- `docker-compose.local-prod.ci-ports.yml` は `ports: !override` を使って base のポート公開を置き換えます。
  - `docker compose` のバージョンが古いと解釈できず失敗する場合があります。その場合は Docker / Docker Compose v2 を更新してください。

補足:

- スモークテスト自体は local-prod ネットワーク内の一時 curl コンテナで実行するため、ブラウザ確認は必須ではありません
- ただし手動確認したい場合は `https://tracen.local:8443/` を開けます（hosts とブラウザの信頼設定は別途必要）

### 4) Full はホスト側の事前セットアップが必要

Full は registry を使って push/pull 相当の確認を行うため、環境によっては以下が必要です。

- `/etc/hosts` に `tracen.local` と `registry.tracen.local` を設定
- Docker が `registry.tracen.local:5000` の CA を信頼する設定

（詳細は README の local-prod 手順を参照）

---

## 実装（どのスクリプトが何をしているか）

- 起動/ビルド/スモーク: [scripts/deploy-local-prod.sh](../../scripts/deploy-local-prod.sh)
  - `TRACEN_LOCAL_PROD_MODE=fast|full` で挙動を切替
  - `TRACEN_LOCAL_PROD_SMOKE_STRATEGY=container` のとき、local-prod ネットワーク内の curl コンテナで `https://tracen.local/api/health` と `/` を確認
- 停止/後片付け: [scripts/down-local-prod.sh](../../scripts/down-local-prod.sh)
- ローカルCI wrapper（必ず cleanup）: [scripts/local-ci-local-prod.sh](../../scripts/local-ci-local-prod.sh)
  - `trap` で EXIT 時に必ず down を実行
- CI用のポート差し替え: [docker-compose.local-prod.ci-ports.yml](../../docker-compose.local-prod.ci-ports.yml)
- 実行コマンド: [package.json](../../package.json)
  - `pnpm local-ci:fast`
  - `pnpm local-ci:full`

---

## 変更時にテスト修正が必要になるポイント

以下を変更した場合、local-ci のスモークやスクリプト修正が必要になる可能性があります。

- `local-prod` のネットワーク名や compose の project 名の前提
  - smoke の `--network "${project}_local-prod"` が依存します
- nginx の upstream / TLS 検証設定
  - upstream のドメイン（`frontend.tracen.local`, `backend.tracen.local`）や CA の扱いが変わると `/api/health` が失敗し得ます
- `/api/health` の契約
  - `runApiHealthCheck` のステップ（作成/削除など）を変えた場合、期待する DB 疎通の保証範囲も変わります
- `docker-compose.local-prod.yml` の証明書配置パス
  - `containers/infra/local-prod/certs/` の配置やファイル名を変えた場合、deploy スクリプトと compose の両方を更新が必要です
- Fast/Full の仕様
  - `deploy-local-prod.sh` のモード分岐を変更した場合、docs と合わせて更新してください

---

## トラブルシューティング（よくあるもの）

- `docker: command not found` / `Cannot connect to the Docker daemon`
  - Dev Container の Docker feature と `/var/run/docker.sock` マウントが入っているか確認
- `curlimages/curl` の pull に失敗する
  - ホスト Docker が外部 pull できる状態か確認（プロキシ/ネットワーク）
- `https://tracen.local/api/health` が 500
  - `docker compose ... logs --tail=200` を確認
  - `/api/health` はユーザー作成/削除まで行うため、DB 接続やマイグレーション不備も検知します
