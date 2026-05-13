# MultiFace バックエンド設計書（Hono + Drizzle + Contracts）

> 対象読者: バックエンドを担当するメンバー（初学者含む）
> 目的: DDD の原則に寄せた Feature-First 設計で、拡張性・保守性を高めるための実装ルールを共有する

以降、パスは `containers/apps/backend/src/` を `src/` として表記します。
また、型共有の `@tracen/contracts` は `containers/apps/contracts/src/` を `contracts/src/` として表記します。

## 0. この設計で守りたいこと（要点）

1. **Feature を単位に閉じる**（`handler / usecase / repository / entity` を 1 か所に）
2. **ビジネスロジック（usecase）はフレームワーク非依存**（Hono の `Context` を持ち込まない）
3. **I/O（DB）は Repository に閉じ込める**（Spec/Impl で差し替え可能に）
4. **入力は contracts の Zod schema で検証**（型とバリデーションの single source）
5. **Composition Root は `src/index.ts`** に集約し、**`AppType` を export** して BFF と型共有する
6. **複数 Feature を跨ぐ「シナリオ」は `app_services/` に集約**（統合 usecase/handler をここに置く）

---

## 1. このドキュメントの目的

このプロジェクトのバックエンドは、

- **Hono**（HTTP ルーティング）
- **Drizzle + postgres.js**（DB）
- **Zod**（入力検証）
- **@tracen/contracts**（型 + schema 共有）

を軸に構築されています。

機能追加時に「どこに何を書くか」「依存方向をどう保つか」を迷わないように、
**現行の実装ルール**と**追加手順（contracts → API）**をまとめます。

---

## 2. 全体アーキテクチャの中でバックエンドはどこにいるか

```
[ユーザーのブラウザ]
        ↓ HTTP/HTTPS
      [ Nginx ]
          ↓
 [frontend-bff (Next.js)]  ← BFF: server-only で backend を呼ぶ
          ↓ HTTP/HTTPS
   [backend (Hono)]
          ↓
     [PostgreSQL]
```

ポイント:

- ブラウザから backend を **直接**呼ぶ前提ではありません（BFF が窓口）。
- ローカル本番相当構成の詳細は [docs/deploy/LOCAL_PROD_DEPLOYMENT.md](../deploy/LOCAL_PROD_DEPLOYMENT.md) を参照してください。

---

## 3. バックエンドのレイヤー構造（最重要）

Feature-First の基本構造は次です。

```
┌──────────────────────────────────────────────────────────┐
│ Composition Root                                          │
│  src/index.ts                                             │
│  - env 読み込み / migrate / ルート合成 / AppType export    │
└───────────────────────┬──────────────────────────────────┘
                        ▼
┌──────────────────────────────────────────────────────────┐
│ HTTP Layer（Handler）                                     │
│  src/features/*/*.handler.ts                              │
│  src/app_services/*/*/*.handler.ts                        │
│  - 入力検証（Zod）/ status 変換 / usecase 呼び出し         │
│  - 依存注入は Middleware（*.di.ts）経由で Context へ        │
└───────────────────────┬──────────────────────────────────┘
                        ▼
┌──────────────────────────────────────────────────────────┐
│ Application Layer（Usecase）                              │
│  src/features/**/domain/**.usecase.ts                     │
│  src/app_services/*/*/*.usecase.ts                        │
│  - ビジネスルール / 前提チェック / ドメインエラー定義      │
└───────────────────────┬──────────────────────────────────┘
                        ▼
┌──────────────────────────────────────────────────────────┐
│ Port（Repository Spec）                                  │
│  src/features/**/domain/**.repository.ts                  │
│  - Spec（契約）                                           │
└───────────────────────┬──────────────────────────────────┘
                        ▼
┌──────────────────────────────────────────────────────────┐
│ Adapter（Infrastructure / Provider）                      │
│  src/shared/infra/db/*                                    │
│  - DB 接続キャッシュ（globalThis）/ migrate / schema       │
│  src/features/**/infra/**/*.*                             │
│  - Drizzle 実装（Repository Impl）/ Worker Impl など        │
│  src/features/**/infra/*.di.ts                            │
│  - Provider（依存の組み立て入口）                           │
└──────────────────────────────────────────────────────────┘
```

依存方向のルール:

- `handler → usecase → repository(spec)` の方向に依存する
- `usecase` は `infra` を import しない（DB 事情を知らない）
- `infra` は `repository(spec)` を実装して差し込む
- `app_services/*` は複数 feature を跨いだ「統合・オーケストレーション」を担当する

---

## 4. ディレクトリ構成（現行）

```
src/
├── index.ts                         # Composition root + server entry
├── env.ts                           # 環境変数バリデーション（Zod）
│
├── app_services/                    # 【横断・統合】複数Featureを跨ぐ「シナリオ」
│   └── auth/
│       ├── auth.di.ts               # app_service 用 DI（Context Variables 注入）
│       └── sign-up/
│           ├── sign-up.handler.ts   # 入力検証 → usecase 呼び出し → HTTP へ
│           └── sign-up.usecase.ts   # 複数 feature を組み合わせた統合処理
│
├── features/                        # Feature-First（機能単位）
│   ├── users/
│   │   ├── users.handler.ts         # HTTP 入口（Zod validate / status mapping）
│   │   ├── domain/
│   │   │   ├── users.di.ts          # Handler 用 DI（userRepo 注入）
│   │   │   ├── users.entity.ts      # ドメイン用 Entity（contracts schema を拡張）
│   │   │   ├── users.error.ts       # ドメインエラー
│   │   │   ├── users.repository.ts  # Repository Spec
│   │   │   └── users.usecase.ts     # ビジネスロジック（出力は schema で検証）
│   │   └── infra/
│   │       ├── users.repository.di.ts
│   │       └── db/
│   │           └── drizzle-user.repository.impl.ts
│   └── auth/
│       ├── domain/
│       │   └── auth.worker.ts       # Worker Spec
│       └── infra/
│           ├── auth.worker.di.ts
│           └── worker/
│               └── argon2-auth-pass.worker.impl.ts
│
└── shared/                          # 横断関心（feature をまたぐ共通）
  ├── infra/
  │   └── db/
  │       ├── client.ts            # Drizzle + postgres.js（接続キャッシュ）
  │       ├── migrate.ts           # drizzle migrator（run once + retry）
  │       ├── schema.ts            # Drizzle schema（テーブル定義）
  │       └── database-url.ts      # DATABASE_URL のフォールバック（主にローカル向け）
  ├── middleware/
  │   └── inject-config.ts         # env→Context Variables(config) 注入
    ├── types/
    │   └── hono.ts                  # Hono Context Variables の型
    └── utils/
        └── async.ts                 # retry/sleep など

(drizzle/)                           # drizzle-kit 生成の migration
(test/)                              # Vitest テスト
```

---

## 5. 命名規則と責務（Handler / Usecase / Repository）

### 5-1. Handler（HTTP 入口）

- ファイル: `src/features/**/**.handler.ts`
- 役割:
  - `zValidator('json' | 'param', schema)` で入力検証
  - `c.req.valid(...)` で型付き入力を取得
  - usecase を呼ぶ
  - usecase 由来のドメインエラーを HTTP ステータスへ変換

例: `GET /users/:id`（現行の抜粋）

```ts
export function usersRouter() {
  return new Hono<UsersHandlerEnv>()
    .use('*', injectUsersDeps())
    .get('/:id', zValidator('param', UserIdParamSchema), async (c) => {
      const { id } = c.req.valid('param');
      const userRepo = c.get('userRepo');
      const userResponse = await getUserResponseById(userRepo, id);
      if (!userResponse) {
        return c.json({ message: 'user not found' }, 404);
      }
      return c.json(userResponse);
    });
}
```

### 5-2. Usecase（ビジネスロジック）

- ファイル: `src/features/**/**.usecase.ts`
- 役割:
  - ルールや前提チェック（例: email 重複チェック）
  - 例外はドメインエラーとして表現し、handler が HTTP に変換する
  - Hono や Drizzle の型を持ち込まない

例: `EmailAlreadyExistsError` を投げる

```ts
export async function createUser(repo: UserRepositorySpec, input: CreateUserInput) {
  const existing = await repo.findByEmail(input.email);
  if (existing) throw new EmailAlreadyExistsError();
  return repo.create(input);
}
```

### 5-3. Repository（Spec + Provider）

- ファイル: `src/features/**/domain/**.repository.ts`
- 役割:
  - `XxxRepositorySpec`（契約）を定義（基本 Promise）
  - DB などの I/O 詳細は持たない（usecase からは Spec のみが見える）

実装（Drizzle など）は `src/features/**/infra/**` 配下に置き、Provider（Factory）は `*.di.ts` にまとめます。

この backend では、DB URL が環境ごとに変わる可能性を考慮して、
`src/shared/infra/db/client.ts` の `getDb(databaseUrl)` で `globalThis` による **接続キャッシュ**を行います。

また、migration は `src/shared/infra/db/migrate.ts` の `runMigrationsOnce()` で **プロセス内 1 回だけ**に制御します。

### 5-4. App Services（複数 Feature を跨ぐ「シナリオ」）

- ディレクトリ: `src/app_services/**`
- 目的: 1つの feature だけでは完結しない **画面/ユースケース単位の統合処理**を提供する
  - 例: タイムライン（複数 feature のデータを統合・整形）
  - 例: プロフィール（ユーザー情報 + 投稿一覧の統合）

app_services のルール:

- `app_services/*/*/*.usecase.ts` は **オーケストレーション専用**
  - 原則として「既存 feature の usecase / repository」を呼び出して組み立てる
  - feature のビジネスルールを複製しない（重複しそうなら feature 側へ寄せる）
- `app_services/*/*/*.handler.ts` は **薄い HTTP 入口**
  - 入力検証は contracts の schema を使う
  - エラー変換は handler の責務に寄せる
- `app_services/*` は `shared/infra/*` を直接 import しない（I/O の詳細は feature 側の Provider の裏に隠す）

### 5-5. DI（`MiddlewareHandler` による依存注入）

このプロジェクトでは「依存注入（DI）」をクラスコンテナ等ではなく、**Hono の Middleware（`MiddlewareHandler`）で行います**。

狙い:

- handler/usecase を薄くし、依存の組み立て（DB/Worker の生成）を 1 箇所に閉じる
- usecase の引数が `Spec` になるように保ち、テストで差し替えしやすくする
- ルート単位で必要な依存だけを `c.set()` で注入できる

基本ルール:

1. `src/shared/middleware/inject-config.ts` を Composition Root（`src/index.ts`）で必ず適用する
   - `c.set('config', Config)` を全ルートに入れる（現行は `.use('*', injectConfig(config))`）
2. feature/app_service ごとに `*.di.ts` を用意し、`MiddlewareHandler<Env>` を返す `injectXxxDeps()` を置く
3. `injectXxxDeps()` は「依存の取得/生成」と `c.set()` のみを行い、ビジネスロジックを書かない
4. 依存の生成は `features/**/infra/*.di.ts`（Provider）を経由する
   - 例: `getUserRepository(config.DATABASE_URL)`、`getAuthPassWorker(config.PEPPER)`
5. handler 側は `c.get()` で依存を取り出し、usecase へ渡す

型（Env）の作り方（現行パターン）:

- まず `AppEnv`（`config` だけを持つ Env）を土台にする
- その上で `Variables` に依存（`userRepo` など）を追加した型を定義する

例: users の DI（抜粋）

```ts
export type UsersHandlerEnv = AppEnv & {
  Variables: { userRepo: UserRepositorySpec };
};

export function injectUsersDeps(): MiddlewareHandler<UsersHandlerEnv> {
  return async (c, next) => {
    const config = c.get('config');
    if (!config) {
      return c.json({ message: 'Config is required' }, 500);
    }
    const userRepo = getUserRepository(config.DATABASE_URL);
    c.set('userRepo', userRepo);
    await next();
  };
}
```

例: app_services/auth の DI（抜粋）

```ts
export type AuthHandlerEnv = AppEnv & {
  Variables: { userRepo: UserRepositorySpec; authPassWorker: AuthPassWorkerSpec };
};
```

---

## 6. contracts（型 + Zod schema）共有の考え方

`@tracen/contracts` は **型と Zod schema を同居**させ、

- backend: 入力検証・DTO 型
- frontend-bff:（将来）入力検証・DTO 型

を **同じ定義**から使うためのパッケージです。

### 6-1. contracts の構成（現行）

```
contracts/src/
├── index.ts                 # barrel export（domain + shared をまとめて export）
├── domain/
│   ├── users/
│   │   ├── user.ts          # UserResponseSchema / UserIdSchema など
│   │   └── user.request.ts  # UserIdParamSchema など
│   └── auth/
│       ├── auth.sign-up.request.ts  # SignUpRequestSchema
│       └── auth.sign-up.ts          # AuthSignUpResponseSchema
└── shared/
  ├── primitives.ts
  └── password.ts
```

### 6-2. backend からの使い方（推奨）

- handler: schema を import して `zValidator` に渡す
- feature 内の型: `src/features/**/**.entity.ts` で `@tracen/contracts` の型を再exportする
  - feature 内の「外部依存（contracts）」を 1 箇所に寄せる目的

---

## 7. 入力バリデーション（Zod + @hono/zod-validator）

backend の入力検証は「境界（handler）」で行います。

- JSON body: `zValidator('json', schema)`
- URL param: `zValidator('param', schema)`

検証後は `c.req.valid('json' | 'param')` で **型付き**に取得できます。

例: `GET /users/:id`

```ts
return new Hono<UsersHandlerEnv>()
  .use('*', injectUsersDeps())
  .get('/:id', zValidator('param', UserIdParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    // id は contracts の schema で検証済み
  });
```

---

## 8. Drizzle による DB 実装（schema / client / migration）

### 8-1. schema

- `src/shared/infra/db/schema.ts` に Drizzle schema を集約します。
- `users.email` の unique 制約など、DB の整合性は DB 側で担保します。

### 8-2. client（接続）

- `src/shared/infra/db/client.ts` で `postgres(databaseUrl)` を作り、`drizzle(sql, { schema })` を返します。
- `globalThis` で DB インスタンスをキャッシュし、同一プロセスで使い回します（URL が同じ場合のみ再利用）。

### 8-3. migration

- `drizzle/` に drizzle-kit が生成する migration が置かれます。
- `src/shared/infra/db/migrate.ts` の `runMigrationsOnce()` を `src/index.ts` から呼びます。
- 実行は環境変数 `RUN_MIGRATIONS` で制御します。

---

## 9. Hono のルーティングと `AppType`（BFF との型共有）

`src/index.ts` でルートを合成した値を `routes` として保持し、
`export type AppType = typeof routes;` を提供します（現行は `export default routes`）。

これにより frontend-bff では Hono RPC クライアントを型安全に生成できます。

```ts
import { hc } from 'hono/client';
import type { AppType } from '@tracen/backend';

const client = hc<AppType>(APP_API_BASE_URL);
```

> 重要: `AppType` の生成元（ルート合成した Hono app）を崩すと、BFF 側の型が壊れます。

### 9-1. Tips: `AppType` の型が欠けないようにする（重要）

このリポジトリでは frontend-bff が `hc<AppType>()` で backend を型安全に呼ぶため、
backend 側の「ルート定義の型（Schema）」が `AppType` に正しく含まれている必要があります。

Hono の `.get()/.post()/.use()/.route()` は fluent interface で、**型レベルでは「ルートが追加された新しい型」を返します**。
実装パターン次第でその型更新が落ちると、ランタイムでは動いていても **BFF 側にルート（例: `.users`）が型として出ません**。

守るべきこと（現行実装にも適用）:

1. ルート登録は **チェーンする**か **戻り値を再代入する**

```ts
// ✅ 推奨（チェーン）
export function usersRouter() {
  return new Hono<UsersHandlerEnv>()
    .use('*', injectUsersDeps())
    .get('/:id', ...)
    .delete('/:id', ...);
}

// ✅ どうしても変数に分けたい場合（再代入）
export function usersRouter() {
  let router = new Hono<UsersHandlerEnv>();
  router = router.use('*', injectUsersDeps());
  router = router.get('/:id', ...);
  router = router.delete('/:id', ...);
  return router;
}
```

```ts
// ⚠️ 非推奨（型更新を捨てるため、Schema が落ちて AppType に反映されないことがある）
export function usersRouter() {
  const router = new Hono<UsersHandlerEnv>();
  router.use('*', injectUsersDeps());
  router.get('/:id', ...);
  router.delete('/:id', ...);
  return router;
}
```

2. `createXxxRouter()` の **戻り値型注釈で `Hono<Env>` に丸めない**

```ts
// ⚠️ これを付けると Schema 型が潰れて AppType が痩せることがある
export function usersRouter(): Hono<UsersHandlerEnv> {
  ...
}
```

原則は **戻り値型注釈を付けずに推論に任せる**のが安全です。

3. Composition Root（`src/index.ts`）の `Hono<...>` は `Context Variables` の契約を揃えるため

`new Hono<AppEnv>()` のように `Env` を付けておくと、middleware が注入する変数（例: `config`）を
`c.get('config')` で型安全に扱えます。

> 補足: `Hono<...>` は主に TypeScript の型情報であり、ランタイムの挙動そのものを変える意図ではありません。

---

## 10. 新しい feature を追加する手順（contracts → API）

例として `Post` という新機能を追加する想定で、迷わない順番をまとめます。

### 10-1. 実装チェックリスト

1. **contracts に型 + schema を追加**

- `contracts/src/domain/posts/` を作る（現行の配置に合わせる）
- `createPostSchema` / `CreatePostInput` / `postSchema` / `Post` / `postIdParamSchema` など
- `contracts/src/index.ts`（barrel）から export されるようにする
- `pnpm --filter @tracen/contracts typecheck`

2. **DB schema と migration（必要な場合）**

- `src/shared/infra/db/schema.ts` にテーブルを追加
- `pnpm --filter @tracen/backend db:generate` で migration を生成
- 起動時に migration を流すなら `RUN_MIGRATIONS=1` を利用

3. **infra（Drizzle 実装）を追加**

- `src/features/posts/infra/db/drizzle-post.repository.impl.ts` のように feature の infra 配下へ追加
- Drizzle による CRUD を実装し、feature の `PostRepositorySpec` を満たす

4. **feature の repository（Spec + Provider）を追加**

- `src/features/posts/domain/posts.repository.ts`
- `PostRepositorySpec` を定義（基本 Promise）
- Provider（DI 入口）として `src/features/posts/infra/posts.repository.di.ts` を用意する

5. **feature の usecase を追加**

- `src/features/posts/domain/posts.usecase.ts`
- 例: `createPost`, `getPostById`, `deletePostById` など
- 例外はドメインエラーに（handler が status に変換）

6. **feature の handler（HTTP）を追加**

- `src/features/posts/posts.handler.ts`
- `zValidator` で入力検証（contracts の schema を使う）
- `router.use('*', injectPostsDeps())` のように DI ミドルウェアを適用する

7. **ルートを合成（Composition Root）**

- `src/index.ts` に `.route('/posts', postsRouter())` を追加
- `AppType` が自動的に更新され、BFF 側の型にも反映される

8. **検証**
   - `pnpm --filter @tracen/backend typecheck`
   - `pnpm --filter @tracen/backend test`
   - 必要に応じて `pnpm --filter @tracen/backend build` / `start`

### 10-2. 複数 Feature を跨ぐシナリオ（app_services）を追加する場合

「画面/ユースケースが複数 feature をまたぐ」場合は `app_services/` に追加します。

1. **contracts に入力/出力 schema を追加（必要な場合）**
   - 例: `contracts/src/feed/` に `timelineQuerySchema` / `timelineItemSchema` など
2. **services の usecase を追加**

- `src/app_services/<scenario>/<scenario>.usecase.ts`
- 複数 feature の usecase / repository を呼び出して統合結果を作る

3. **services の handler を追加**

- `src/app_services/<scenario>/<scenario>.handler.ts`
- 入力検証（contracts）→ services usecase 呼び出し → HTTP へ変換

4. **ルートを合成**

- `src/index.ts` に `.route('/feed', feedRouter())` のように追加

5. **検証**
   - `pnpm --filter @tracen/backend typecheck` / `test`

---

## 11. 環境変数（env.ts）

`src/env.ts` で Zod により環境変数を検証します。

主な変数:

- `PORT`（default: 8000）
- `DATABASE_URL`（DB 利用時に必要）
- `RUN_MIGRATIONS`（起動時に migration を流す）
- `TLS_CERT_PATH` / `TLS_KEY_PATH`（HTTPS 起動用）

`NODE_ENV=production` のときは `TLS_*` と `DATABASE_URL` が必須になるようにチェックしています。

---

## 12. まとめ：今日から意識すること

1. **Feature を跨ぐ依存を増やさない**（共通化は `shared/` へ）
2. **usecase をフレームワーク非依存に保つ**（テストしやすさにも直結）
3. **contracts を single source に**（型とバリデーションを重複させない）
4. **`AppType` を守る**（BFF 側の型安全呼び出しの要）
