# BFF API 開発ガイド（tracen）

このドキュメントは、今回導入した **BFF（frontend-bff / Next.js）経由の API 方針**と、開発時の実装ルールをまとめたものです。

## 目的と前提

- **backend（Hono）の API をブラウザから直接使わせない**
- frontend（ブラウザ）は **BFF が提供する API だけ**を呼ぶ
- BFF は必要に応じて backend の API を呼び、レスポンスを **加工・集約**して返す
- backend をそのまま外部に公開するための **汎用プロキシ（`/api/* -> backend/*` の透過転送）は実装しない**

補足（型・バリデーション共有）:
- backend は `@tracen/backend` から **Hono の `AppType`（ルート型）**を export しており、BFF は Hono RPC（`hc<AppType>`）で **型安全に backend を呼び出します**。
- `@tracen/contracts` は **Zod schema と型を同居**させた共有パッケージで、BFF でも **同じ schema を使って入力検証**できます（backend 側でも検証するので二重になりますが、BFF の入口で弾ける利点があります）。

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

### 4) backend 呼び出しは Hono RPC + `AppType` で型安全に行う

- BFF は `@tracen/backend` の `AppType` を `import type` し、`hc<AppType>(APP_API_BASE_URL)` でクライアントを生成する
- backend のルート変更は `AppType` に反映されるため、BFF 側で **コンパイル時に破壊的変更を検知**できる

Tips: `hc<AppType>()` で期待したルート（例: `client.users`）が型として見えない場合

- backend 側で `AppType` に「ルート定義の型（Schema）」が含まれていない可能性があります。
  - ルーター実装で `router.get(...); router.post(...);` の **戻り値（型更新）を捨てていないか**
  - `createXxxRouter()` に `: Hono<Env>` のような **戻り値型注釈で Schema を潰していないか**
  - `src/index.ts` の Composition Root で `.route('/xxx', createXxxRouter(...))` まで含んだ値を `AppType` にしているか

詳細は backend 側の設計書（`AppType` の Tips）も参照してください。

### 5) 入力バリデーションは `@tracen/contracts` の Zod schema を再利用する

- BFF の Route Handler / Server Actions の入口で `@tracen/contracts` の schema を使って検証する
- backend でも検証するため「二重検証」になるが、
  - BFF の入口で **早期に 400 を返せる**
  - UI 側の入力と backend の期待値のズレを **同じ schema**で防げる
  - 透過プロキシ化せず **ユースケース単位の API**にしやすい

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

このプロジェクトでは、Hono RPC（`hono/client` の `hc`）を使い、backend の `AppType` から型安全なクライアントを生成します。

```ts
import 'server-only';

import { hc } from 'hono/client';
import type { AppType } from '@tracen/backend';

import { getServerEnv } from './env/server';

export function getBackendClient() {
  return hc<AppType>(getServerEnv().APP_API_BASE_URL);
}
```

> 実際の実装は `getBackendClient()` の結果をキャッシュしています（毎回 `hc()` しない）。

### サンプル: `GET /api/hello`

要件サンプルとして、backend の `GET /hello` を呼んだ結果に、BFF 側のテキストを付与して返します。

- Route Handler: `containers/apps/frontend-bff/src/app/api/hello/route.ts`
  - backend: `getBackendClient().hello.$get()`
  - 返却: `{ message: backendMessage + " (via BFF)" }`

ポイント:
- `hello.$get()` は `AppType` に基づいて型付けされます
- backend のルートやレスポンスが変わった場合、BFF 側で型エラーとして検知できます

### contracts による入力検証（BFF 側）

backend へ渡す入力（body/param）は、BFF 側でも `@tracen/contracts` の schema で検証できます。

例: body の検証（`createUserSchema`）

```ts
import { NextResponse } from 'next/server';
import { createUserSchema } from '@tracen/contracts';

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = createUserSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'invalid request', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  // parsed.data は型付き
  // const input = parsed.data;
}
```

例: param の検証（`userIdParamSchema`）

```ts
import { NextResponse } from 'next/server';
import { userIdParamSchema } from '@tracen/contracts';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const parsed = userIdParamSchema.safeParse({ id: userId });
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'invalid userId', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { id } = parsed.data;
  // id は uuid として検証済み
}
```

> ルール: BFF が backend の API をそのまま透過しないため、BFF の 400/404/409 などの返し方は「ユースケース単位」で設計します。

### 推奨: backend 呼び出しは BFF の Repository 経由にする

backend 呼び出しを Route Handler から直に行うこともできますが、原則は **Repository に閉じ込める**のを推奨します。

- 呼び出し元（Route Handler / Server Actions / Usecase）は「どこからデータを取るか」を意識しない
- モック → backend 実装への差し替えが小さくなる
- エラー変換やレスポンス整形を 1 箇所に閉じ込めやすい

Repository パターンの詳細は以下も参照してください:
- [FRONTEND_ARCHITECTURE.md](../frontend-bff/FRONTEND_ARCHITECTURE.md)
- [BACKEND_ARCHITECTURE.md](../architecture/BACKEND_ARCHITECTURE.md)

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

目的別に 2 つの追加パスがあります:
- **BFF の公開 API（`/api/*`）を増やす**（ブラウザが呼ぶ入口）
- **backend 呼び出しの実装を増やす**（BFF の server-only 側）

### A) BFF の公開 API（Route Handler）を追加する

1. Route Handler を追加（`src/app/api/<usecase>/route.ts`）
2. 入口で入力を検証（`@tracen/contracts` の Zod schema を使う）
3. Usecase を呼ぶ（推奨: `src/server/usecases/**`）
4. ユースケース単位でレスポンスを整形して返す（透過しない）

### B) backend を呼ぶ Repository を追加（または差し替え）する

1. Repository Spec を定義（`src/repositories/<name>-repository.ts`）
   - `XxxRepositorySpec`（契約）を定義（メソッドは基本 `Promise`）
2. backend 実装（Impl）を追加
   - `createXxxApiRepositoryImpl()` を作り、`getBackendClient()` を使って backend を呼ぶ
   - Hono RPC 例:

```ts
const res = await getBackendClient().users[':id'].$get({ param: { id } });
```

3. Provider（DI 入口）を用意
   - `createSingletonProvider()` で singleton 化し、Usecase からは `getXxxRepository()` だけを見る
4. Usecase から Repository を呼ぶ
   - `src/server/usecases/**` にユースケース関数を追加
5. 既存モックから差し替える場合
   - Provider の返す実装を API 実装に切り替える（実装の選択は Provider に閉じ込める）

### C) フロント（ブラウザ）からの呼び出しを追加する

1. フロント側の呼び出し関数を `src/lib/api.ts` に追加（起点は `NEXT_PUBLIC_BFF_API_BASE_URL`）
2. UI から呼ぶ

### D) 必要なら env を追加する

- `.env.dev` / `.env.local-prod`（コメント付き）
- `.env.dev.example` / `.env.local-prod.example`（Git 管理。コメント＋安全なデフォルト値）
- Zod スキーマ（public/server/backend）を更新

### E) 検証

- `pnpm --filter @tracen/frontend-bff typecheck`
- dev で `http://localhost:8080/api/<usecase>` を curl / ブラウザで確認

