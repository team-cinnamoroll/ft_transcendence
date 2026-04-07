# tracen

モノレポ構成で以下を提供する Web アプリケーション開発環境です。

- frontend-bff: Next.js 16.2.2
- backend: Hono 4.12.10 + Vite
- proxy: Nginx
- database: MariaDB
- package manager: pnpm
- Node.js: 24

## ディレクトリ構成

- apps/frontend-bff: Next.js アプリ
- apps/backend: Hono API
	- src: backend の実装コード
	- test: Vitest のテストコード
- infra/nginx: Nginx 設定
- infra/db: MariaDB 初期化 SQL
- .devcontainer: VS Code Dev Container 設定

## 開発環境の実行方法

推奨は VS Code Dev Container での実行です。

### 前提

- Docker Desktop（OrbStack） が起動していること
- VS Code の Dev Containers 拡張が有効であること

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
- Hono API 直アクセス: http://localhost:8000/hello
- MariaDB: localhost:3306

Nginx 経由では、以下のルーティングです。

- /api/* -> backend:8000
- /* -> frontend:3000

### 補足: 開発時の起動コマンド

compose 内では次のコマンドが実行されます。

- frontend: pnpm --filter @tracen/frontend-bff exec next dev --hostname 0.0.0.0 --port 3000
- backend: pnpm --filter @tracen/backend exec vite --host 0.0.0.0 --port 8000

ルートで開発起動したい場合は次でも実行可能です。

```bash
pnpm dev
```

## プロダクション作成手順

現在の docker-compose.yml は開発向け設定です。
本番では apps/backend/Dockerfile と apps/frontend-bff/Dockerfile からイメージを作成して実行します。

### 手順 1: プロダクションイメージをビルド

リポジトリルートで実行します。

```bash
docker build -t tracen-backend:prod -f apps/backend/Dockerfile .
docker build -t tracen-frontend-bff:prod -f apps/frontend-bff/Dockerfile .
```

### 手順 2: 共通ネットワークを作成

```bash
docker network create tracen-net
```

すでに存在する場合はエラーになっても問題ありません。

### 手順 3: MariaDB を起動

```bash
docker run -d \
	--name tracen-db \
	--network tracen-net \
	-e MARIADB_ROOT_PASSWORD=root \
	-e MARIADB_DATABASE=tracen \
	-e MARIADB_USER=tracen \
	-e MARIADB_PASSWORD=tracen \
	-p 3306:3306 \
	mariadb:11.7
```

必要なら初期化 SQL を投入します。

```bash
docker cp infra/db/init.sql tracen-db:/init.sql
docker exec tracen-db sh -lc "mariadb -uroot -proot < /init.sql"
```

### 手順 4: backend を起動

```bash
docker run -d \
	--name tracen-backend \
	--network tracen-net \
	-e PORT=8000 \
	-p 8000:8000 \
	tracen-backend:prod
```

### 手順 5: frontend-bff を起動

```bash
docker run -d \
	--name tracen-frontend-bff \
	--network tracen-net \
	-e NEXT_PUBLIC_API_BASE_URL=http://tracen-backend:8000 \
	-p 3000:3000 \
	tracen-frontend-bff:prod
```

### 手順 6: Nginx を起動

```bash
docker run -d \
	--name tracen-nginx \
	--network tracen-net \
	-p 8080:80 \
	-v "$(pwd)/infra/nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro" \
	nginx:1.27-alpine
```

### 手順 7: 本番動作確認

- http://localhost:8080
- http://localhost:8080/api/hello

## 停止とクリーンアップ

開発環境停止:

```bash
docker compose down
```

本番検証コンテナ停止:

```bash
docker rm -f tracen-nginx tracen-frontend-bff tracen-backend tracen-db
```
