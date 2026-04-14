# tracen

モノレポ構成で以下を提供する Web アプリケーション開発環境です。

- frontend-bff: Next.js 16.2.2
- backend: Hono 4.12.10 + Vite
- proxy: Nginx
- database: PostgreSQL
- package manager: pnpm
- Node.js: 24

## ディレクトリ構成

- containers/apps/frontend-bff: Next.js アプリ
- containers/apps/backend: Hono API
	- src: backend の実装コード
	- test: Vitest のテストコード
- containers/infra/nginx: Nginx 設定
- containers/infra/db: PostgreSQL 初期化 SQL
- .devcontainer: VS Code Dev Container 設定

開発者向けドキュメント:

- BFF API 方針: [docs/api/BFF_API_GUIDE.md](docs/api/BFF_API_GUIDE.md)

## 開発環境の実行方法

推奨は VS Code Dev Container での実行です。

### 前提

- Docker Desktop（OrbStack） が起動していること
- VS Code の Dev Containers 拡張が有効であること

このリポジトリは環境変数ファイルを利用します。Dev Container 起動前に以下を用意してください。

```bash
cp .env.dev.example .env.dev
```

### 手順 1: Dev Container で起動

1. VS Code でこのリポジトリを開く
2. Reopen in Container を実行する
3. 初回起動時に postCreateCommand で pnpm install が実行される

Dev Container 起動時に、以下のサービスが docker compose で同時に起動します。

- dev-container
- frontend
- backend
- nginx
- db

### 手順 2: 動作確認

- ブラウザ入口: http://localhost:8080
- Next.js 直アクセス: http://localhost:3000
- Hono API 直アクセス（デバッグ用）: http://localhost:8000/hello
- BFF API（推奨）: http://localhost:8080/api/hello
- PostgreSQL: localhost:5432

Nginx 経由では、以下のルーティングです。

- /api/* -> frontend:3000（BFF API。必要に応じて backend:8000 を呼び出す）
- /* -> frontend:3000

### Tips: Nginx が 502 になる場合

起動直後やコンテナ再作成後に、`http://localhost:8080` が `502 Bad Gateway` になることがあります。

- まず直アクセスで切り分けする
	- `http://localhost:3000`（Next.js）と `http://localhost:8000/hello`（API）が表示されるか確認
	- 起動直後は dev server の起動まで 502 になることがあるため、数十秒待って再読込
- 直アクセスは OK で nginx だけ 502 の場合は nginx を再起動する（IP 変化・名前解決の影響を受けることがあります）

```bash
docker compose -f docker-compose.dev.yml restart nginx
```

- 原因が分からない場合はログと状態を見る

```bash
docker compose -f docker-compose.dev.yml ps
docker compose -f docker-compose.dev.yml logs -f --tail=200 nginx frontend backend
```

補足:

- `containers/infra/nginx/nginx.conf` を編集した場合、反映には `docker compose -f docker-compose.dev.yml restart nginx` が必要です。
- `containers/infra/nginx/nginx.conf` は Docker DNS（127.0.0.11）を使って upstream を再解決する設定を入れてあります。ローカルで設定を差し替えている場合は、同等の設定になっているか確認してください。

### 補足: 開発時の起動コマンド

compose 内では次のコマンドが実行されます。

- frontend: pnpm --filter @tracen/frontend-bff exec next dev --hostname 0.0.0.0 --port 3000
- backend: pnpm --filter @tracen/backend exec vite --host 0.0.0.0 --port 8000

ルートで開発起動したい場合は次でも実行可能です。

```bash
pnpm dev
```

## プロダクション作成手順

### 推奨: ローカル本番相当（HTTPS + ローカルレジストリ + 1コマンドデプロイ）

この手順は「ローカルPC上で本番に近い構成（build 済みイメージ + レジストリ + HTTPS）を 1コマンドで起動」するためのものです。

前提:

- デプロイ操作（docker / mkcert / hosts 変更）はホストOS（Ubuntu想定）で実行します
- Dev Container は編集専用です

#### 手順 1: hosts を設定

ホストOSの `/etc/hosts` に以下を追加します。

```
127.0.0.1 tracen.local registry.tracen.local
```

#### 手順 2: mkcert を用意して TLS 資材を生成

ホストOSに mkcert をインストールし、ローカルCAを信頼させます。

```bash
mkcert -install
```

次に、このリポジトリで TLS 資材を生成します。

```bash
pnpm local-prod:setup-tls
```

#### 手順 3: Docker がローカルレジストリの TLS を信頼するように設定

ホストOSで以下を実行します。

```bash
sudo mkdir -p /etc/docker/certs.d/registry.tracen.local:5000
sudo cp containers/infra/local-prod/certs/ca.crt /etc/docker/certs.d/registry.tracen.local:5000/ca.crt
```

環境によっては Docker の再起動が必要な場合があります。

#### 手順 4: 1コマンドデプロイ

まず、環境変数ファイルを用意します。

```bash
cp .env.local-prod.example .env.local-prod
```

```bash
pnpm local-prod:deploy
```

#### 手順 5: 動作確認

- 入口: https://tracen.local
- BFF API: https://tracen.local/api/hello

#### 停止

```bash
pnpm local-prod:down
```

補足:

- `docker-compose.local-prod.yml` はデフォルトで HTTPS（`443`）のみを公開します（ホストの `80` が他プロセスで使用中でも起動しやすくするため）。HTTP→HTTPS リダイレクトが必要な場合は `docker-compose.local-prod.yml` で `80:80` の公開を追加してください。
- rootless Docker などで `443` の公開が難しい場合は、ポートを `8443` 等に変更してください。
- `.local` が環境の名前解決と衝突する場合は、`tracen.test` などへ切り替えてください（hosts / 証明書SAN / compose の alias も同様に変更が必要です）。

### 参考: 手動でのプロダクション検証（旧手順）

この手順は HTTPS 対応前の名残です。現在は `docker-compose.local-prod.yml` と `pnpm local-prod:deploy` を利用してください。

## 停止とクリーンアップ

開発環境停止:

```bash
docker compose -f docker-compose.dev.yml down
```

ローカル本番相当の停止:

```bash
pnpm local-prod:down
```

