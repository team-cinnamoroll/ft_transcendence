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
6. **複数 Feature を跨ぐ「シナリオ」は `services/` に集約**（統合 usecase/handler をここに置く）

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
│  src/features/**/**.handler.ts                            │
│  src/services/**/**.handler.ts                            │
│  - 入力検証（Zod）/ status 変換 / usecase 呼び出し         │
└───────────────────────┬──────────────────────────────────┘
                        ▼
┌──────────────────────────────────────────────────────────┐
│ Application Layer（Usecase）                              │
│  src/features/**/**.usecase.ts                            │
│  src/services/**/**.usecase.ts                            │
│  - ビジネスルール / 前提チェック / ドメインエラー定義      │
└───────────────────────┬──────────────────────────────────┘
                        ▼
┌──────────────────────────────────────────────────────────┐
│ Port（Repository Spec + Provider）                        │
│  src/features/**/**.repository.ts                         │
│  - Spec（契約） / Factory / Provider（DI 入口）            │
└───────────────────────┬──────────────────────────────────┘
                        ▼
┌──────────────────────────────────────────────────────────┐
│ Adapter（Infrastructure）                                 │
│  src/infra/**                                              │
│  - Drizzle 実装 / DB 接続 / migrate / schema               │
└──────────────────────────────────────────────────────────┘
```

依存方向のルール:
- `handler → usecase → repository(spec)` の方向に依存する
- `usecase` は `infra` を import しない（DB 事情を知らない）
- `infra` は `repository(spec)` を実装して差し込む
- `services/*` は複数 feature を跨いだ「統合・オーケストレーション」を担当する

---

## 4. ディレクトリ構成（現行）

```
src/
├── index.ts                         # Composition root + server entry
├── env.ts                           # 環境変数バリデーション（Zod）
│
├── features/                        # Feature-First（機能単位）
│   └── auth/
│       ├── user.handler.ts          # HTTP 入口（Zod validate / status mapping）
│       ├── user.usecase.ts          # ビジネスロジック
│       ├── user.repository.ts       # Spec + Provider（singleton）
│       └── user.entity.ts           # contracts の型再export（依存を集約）
│
├── services/                         # 【横断・統合】複数Featureを跨ぐ「シナリオ」
│   ├── feed/
│   │   ├── feed.usecase.ts           # PostとSocialを組み合わせてタイムラインを生成
│   │   └── feed.handler.ts           # タイムライン取得用のAPI
│   └── user-profile/
│       ├── profile.usecase.ts        # Auth(ユーザー情報)とPost(投稿一覧)を統合
│       └── profile.handler.ts        # プロフィール画面用のAPI
│
├── infra/                           # 外部I/O（DBなど）
│   ├── db/
│   │   ├── client.ts                # Drizzle + postgres.js（接続キャッシュ）
│   │   ├── migrate.ts               # drizzle migrator（run once + retry）
│   │   └── schema.ts                # Drizzle schema（テーブル定義）
│   └── repositories/
│       └── drizzle-user.repo.ts     # UserRepository の Drizzle 実装
│
└── shared/                          # 横断関心（feature をまたぐ共通）
    ├── middleware/
    │   └── require-database-url.ts  # env→Context Variables 注入
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

例: `POST /users`（抜粋イメージ）

```ts
router.post('/', zValidator('json', createUserSchema), async (c) => {
  const input = c.req.valid('json');
  const repo = getUserRepository(c.get('databaseUrl'));

  try {
    const created = await createUser(repo, input);
    return c.json({ id: created.id }, 201);
  } catch (err) {
    if (err instanceof EmailAlreadyExistsError) {
      return c.json({ message: 'email already exists' }, 409);
    }
    throw err;
  }
});
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

- ファイル: `src/features/**/**.repository.ts`
- 役割:
  - `XxxRepositorySpec`（契約）を定義（基本 Promise）
  - 実装（infra）を組み立てる `createXxxRepository(db)`
  - DI 入口として `getXxxRepository(...)` を提供

この backend では、DB URL が環境ごとに変わる可能性を考慮して、
`globalThis` を使った **singleton キャッシュ**を Provider に閉じ込めています。

### 5-4. Services（複数 Feature を跨ぐ「シナリオ」）

- ディレクトリ: `src/services/**`
- 目的: 1つの feature だけでは完結しない **画面/ユースケース単位の統合処理**を提供する
  - 例: タイムライン（複数 feature のデータを統合・整形）
  - 例: プロフィール（ユーザー情報 + 投稿一覧の統合）

services のルール:
- `services/*/*.usecase.ts` は **オーケストレーション専用**
  - 原則として「既存 feature の usecase / repository」を呼び出して組み立てる
  - feature のビジネスルールを複製しない（重複しそうなら feature 側へ寄せる）
- `services/*/*.handler.ts` は **薄い HTTP 入口**
  - 入力検証は contracts の schema を使う
  - エラー変換は handler の責務に寄せる
- `services/*` は `infra/*` を直接 import しない（DB の詳細は feature repository の裏に隠す）

---

## 6. contracts（型 + Zod schema）共有の考え方

`@tracen/contracts` は **型と Zod schema を同居**させ、
- backend: 入力検証・DTO 型
- frontend-bff:（将来）入力検証・DTO 型

を **同じ定義**から使うためのパッケージです。

### 6-1. contracts の構成（現行）

```
contracts/src/
├── index.ts               # barrel export
├── users/
│   ├── create-user.ts     # createUserSchema + CreateUserInput
│   ├── user.ts            # userSchema + User
│   ├── params.ts          # userIdParamSchema + UserIdParam
│   └── ids.ts             # UserId（uuid の alias）
└── shared/
    └── primitives/
        ├── uuid.ts
        ├── email.ts
        └── iso-datetime.ts
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
router.get('/:id', zValidator('param', userIdParamSchema), async (c) => {
  const { id } = c.req.valid('param');
  // id は uuid として検証済み
});
```

---

## 8. Drizzle による DB 実装（schema / client / migration）

### 8-1. schema

- `src/infra/db/schema.ts` に Drizzle schema を集約します。
- `users.email` の unique 制約など、DB の整合性は DB 側で担保します。

### 8-2. client（接続）

- `src/infra/db/client.ts` で `postgres(databaseUrl)` を作り、`drizzle(sql, { schema })` を返します。
- `globalThis` で DB インスタンスをキャッシュし、同一プロセスで使い回します。

### 8-3. migration

- `drizzle/` に drizzle-kit が生成する migration が置かれます。
- `src/infra/db/migrate.ts` の `runMigrationsOnce()` を `src/index.ts` から呼びます。
- 実行は環境変数 `RUN_MIGRATIONS` で制御します。

---

## 9. Hono のルーティングと `AppType`（BFF との型共有）

`src/index.ts` でルートを合成した値を `routes` として export し、
`export type AppType = typeof routes;` を提供します。

これにより frontend-bff では Hono RPC クライアントを型安全に生成できます。

```ts
import { hc } from 'hono/client';
import type { AppType } from '@tracen/backend';

const client = hc<AppType>(APP_API_BASE_URL);
```

> 重要: `AppType` の生成元（ルート合成した Hono app）を崩すと、BFF 側の型が壊れます。

---

## 10. 新しい feature を追加する手順（contracts → API）

例として `Post` という新機能を追加する想定で、迷わない順番をまとめます。

### 10-1. 実装チェックリスト

1. **contracts に型 + schema を追加**
   - `contracts/src/posts/` を作る
   - `createPostSchema` / `CreatePostInput` / `postSchema` / `Post` / `postIdParamSchema` など
   - `contracts/src/index.ts`（barrel）から export されるようにする
   - `pnpm --filter @tracen/contracts typecheck`

2. **DB schema と migration（必要な場合）**
   - `src/infra/db/schema.ts` にテーブルを追加
   - `pnpm --filter @tracen/backend db:generate` で migration を生成
   - 起動時に migration を流すなら `RUN_MIGRATIONS=1` を利用

3. **infra（Drizzle 実装）を追加**
   - `src/infra/repositories/drizzle-post.repo.ts` を追加
   - Drizzle による CRUD を実装し、feature の `PostRepositorySpec` を満たす

4. **feature の repository（Spec + Provider）を追加**
   - `src/features/<context>/post.repository.ts`
   - `PostRepositorySpec` を定義（基本 Promise）
   - `createPostRepository(db)` と `getPostRepository(databaseUrl)` を用意

5. **feature の usecase を追加**
   - `src/features/<context>/post.usecase.ts`
   - 例: `createPost`, `getPostById`, `deletePostById` など
   - 例外はドメインエラーに（handler が status に変換）

6. **feature の handler（HTTP）を追加**
   - `src/features/<context>/post.handler.ts`
   - `zValidator` で入力検証（contracts の schema を使う）
   - `requireDatabaseUrl(env)` を `router.use('*', ...)` で適用

7. **ルートを合成（Composition Root）**
   - `src/index.ts` に `.route('/posts', createPostRouter(env))` を追加
   - `AppType` が自動的に更新され、BFF 側の型にも反映される

8. **検証**
   - `pnpm --filter @tracen/backend typecheck`
   - `pnpm --filter @tracen/backend test`
   - 必要に応じて `pnpm --filter @tracen/backend build` / `start`

### 10-2. 複数 Feature を跨ぐシナリオ（services）を追加する場合

「画面/ユースケースが複数 feature をまたぐ」場合は `services/` を追加します。

1. **contracts に入力/出力 schema を追加（必要な場合）**
   - 例: `contracts/src/feed/` に `timelineQuerySchema` / `timelineItemSchema` など
2. **services の usecase を追加**
   - `src/services/<scenario>/<scenario>.usecase.ts`
   - 複数 feature の usecase / repository を呼び出して統合結果を作る
3. **services の handler を追加**
   - `src/services/<scenario>/<scenario>.handler.ts`
   - 入力検証（contracts）→ services usecase 呼び出し → HTTP へ変換
4. **ルートを合成**
   - `src/index.ts` に `.route('/feed', createFeedRouter(env))` のように追加
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
