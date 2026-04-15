# BFF API 開発ガイド（tracen）

このドキュメントは、今回導入した **BFF（frontend-bff / Next.js）経由の API 方針**と、開発時の実装ルールをまとめたものです。

## 目的と前提

- **backend（Hono）の API をブラウザから直接使わせない**
- frontend（ブラウザ）は **BFF が提供する API だけ**を呼ぶ
- BFF は必要に応じて backend の API を呼び、レスポンスを **加工・集約**して返す
- backend をそのまま外部に公開するための **汎用プロキシ（`/api/* -> backend/*` の透過転送）は実装しない**

## アーキテクチャ（ルーティング）

### dev

- 入口: `http://localhost:8080`（nginx）
- ルーティング:
  - `/api/*` → `frontend-bff`（Next dev）
  - `/*` → `frontend-bff`（Next dev）
- backend（デバッグ用直アクセス）: `http://localhost:8000/hello`

### local-prod

- 入口: `https://tracen.local`（nginx）
- ルーティング:
  - `/api/*` → `frontend-bff`（Next standalone + HTTPS server）
  - `/*` → `frontend-bff`
- BFF → backend は Docker ネットワーク内で `APP_API_BASE_URL` を使ってアクセス

## API の方針（ルール）

### 1) 公開 API は BFF のみ

- frontend（ブラウザ）が呼べる API は **BFF の `/api/*` のみ**
- backend の origin / base URL を `NEXT_PUBLIC_*` に載せるのは禁止

### 2) BFF は「ユースケース単位」で API を実装

- BFF の API は **必要な分だけ**を実装する
- backend の全 API を外部へそのまま公開するような「透過プロキシ」は作らない

### 3) env 変数の命名

- フロント（ブラウザ）→ BFF: `NEXT_PUBLIC_BFF_API_BASE_URL`
  - `NEXT_PUBLIC_` はクライアントバンドルに公開されるため、**公開してよい値だけ**にする
  - 値は **`/api` まで含む**（例: `http://localhost:8080/api` / `https://tracen.local/api`）
- BFF（server）→ backend: `APP_API_BASE_URL`
  - server-only（ブラウザに出さない）

## 環境変数と `.env` 運用

### ファイル

- 開発: `.env.dev`（Git管理しない） / `.env.dev.example`（Git管理する）
- local-prod: `.env.local-prod`（Git管理しない） / `.env.local-prod.example`（Git管理する）
- デプロイスクリプトが生成する `.env.local-prod.local` は **現状運用のまま**（`TRACEN_IMAGE_TAG` 用）

### 必須（frontend-bff）

- `NEXT_PUBLIC_BFF_API_BASE_URL`（public）
  - **ビルド時注入が必須**
  - local-prod では compose の `build.args` → Dockerfile の `ARG/ENV` で `next build` に渡す
  - `containers/apps/frontend-bff/next.config.ts` で未設定ならエラーにする
- `APP_API_BASE_URL`（server）
  - BFF が backend を呼ぶために使用
- `NODE_EXTRA_CA_CERTS`（server, 任意だが推奨）
  - `APP_API_BASE_URL` が `https://` の場合は必須（mkcert CA を Node が信頼するため）

### Zod による env 検証

- BFF public env: `containers/apps/frontend-bff/src/lib/env/public.ts`
- BFF server env: `containers/apps/frontend-bff/src/lib/env/server.ts`
- BFF custom HTTPS server の env: `containers/apps/frontend-bff/server-https.cjs`
- backend env: `containers/apps/backend/src/env.ts`

## BFF API の実装方法（推奨パターン）

### 実装場所

- Next App Router の Route Handler を使用
- 配置例:
  - `containers/apps/frontend-bff/src/app/api/hello/route.ts`

### backend 呼び出し

- server-only のモジュールで backend クライアントを提供する
  - `containers/apps/frontend-bff/src/lib/backend-client.ts`
  - `import 'server-only'` を入れて、client bundle への混入を防ぐ

### サンプル: `GET /api/hello`

要件サンプルとして、backend の `GET /hello` を呼んだ結果に、BFF 側のテキストを付与して返します。

- Route Handler: `containers/apps/frontend-bff/src/app/api/hello/route.ts`
  - backend: `getBackendClient().hello.$get()`
  - 返却: `{ message: backendMessage + " (via BFF)" }`

### エラーハンドリング指針

- backend が非 2xx を返した場合は、BFF 側で以下のどちらかに統一する
  - **そのまま status を返す**（メッセージは BFF 側で定型化）
  - **ユースケース用の status に変換**（例: backend 4xx を BFF 4xx に寄せる）
- backend の生レスポンスを透過する（ヘッダ/本文を全コピーする）のは禁止（汎用プロキシ化の温床）

## frontend（ブラウザ）からの呼び方

- BFF API の呼び出しは `NEXT_PUBLIC_BFF_API_BASE_URL` を起点にする
- 実装例:
  - `containers/apps/frontend-bff/src/lib/api.ts` の `fetchHelloFromBff()`
  - `containers/apps/frontend-bff/src/app/HelloFromBff.tsx`（client component）

## 開発時の注意点（dev）

### nginx 設定変更を反映するには再起動が必要

- `containers/infra/nginx/nginx.conf` を変えた場合、nginx コンテナの再起動が必要です。
- Dev Container 内には `docker` が無い前提のため、ホスト側で実行します。

```bash
docker compose -f docker-compose.dev.yml restart nginx
```

### curl の宛先に注意（Host ヘッダ）

- `curl http://nginx/...` のように **サービス名宛て**に叩くと、Host が `nginx` になり、dev server 側の host チェックに引っかかる場合があります。
- 基本は `http://localhost:8080`（nginx の公開ポート）で確認してください。

## 新しい API を追加する手順（チェックリスト）

1. BFF 側に Route Handler を追加（`src/app/api/<name>/route.ts`）
2. server-only で backend を呼ぶ（`getBackendClient()` を使う or server-only fetch）
3. フロント側の呼び出し関数を `src/lib/api.ts` に追加
4. 必要なら env を追加
   - `.env.dev` / `.env.local-prod`（コメント付き）
  - `.env.dev.example` / `.env.local-prod.example`（Git管理。コメント＋安全なデフォルト値）
   - Zod スキーマ（public/server/backend）を更新
5. dev で `http://localhost:8080/api/<name>` を curl / ブラウザで確認

