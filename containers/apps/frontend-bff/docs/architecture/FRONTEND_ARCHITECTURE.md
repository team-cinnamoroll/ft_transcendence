# MultiFace フロントエンド設計書（Next.js + BFF）

> 対象読者: フロントエンドを担当するメンバー（初学者含む）
> 目的: バックエンド統合時にスムーズに差し替えられるモック/実装を作るための設計方針を共有する

以降、パスは `containers/apps/frontend-bff/src/` を `src/` として表記します。

## 0. この設計で守りたいこと（要点）

1. **UI から「どこからデータを取るか」を剥がす**（モック→APIの差し替えを小さくする）
2. **契約（interface）は `xxSpec`、実装は `xxImpl`**（命名で役割が分かるようにする）
3. **契約（Spec）は async（Promise）をデフォルト**（モックでも必ず `async` 実装）
4. **依存解決（DI）は Repository の Provider に閉じ込める**（Factory + Provider）
5. **共通ロジックは `src/server/usecases` に集約**し、**Server Actions / Route Handler は薄い入口**にする

---

## 1. このドキュメントの目的

このプロジェクトは、[ARCHITECTURE.md](../../../../../docs/architecture/ARCHITECTURE.md) に記載された Hono バックエンドとの統合を、**機能ごとに段階的に**進めています。

現時点で「モック → API 実装」への差し替えが完了している機能:

- 認証（サインアップ・サインイン・サインアウト）: `repositories/auth-repository.ts`（[AUTH.md](../auth/AUTH.md) 参照）
- ユーザープロフィール（表示・編集）: `repositories/user-profile-repository.ts`（[USER_PROFILE.md](../user-profile/USER_PROFILE.md) 参照）
- backend 疎通確認: `repositories/backend-health-repository.ts`

一方、Face・Seed・Subscription・Notification などはまだモックのままです（[CONNECTION_PLAN.md](../CONNECTION_PLAN.md) 参照）。

統合のたびに「全部書き直し」にならないよう、**差し替えやすい設計を維持し続けること**がこのドキュメントの目的です。

---

## 2. 全体アーキテクチャの中でフロントエンドはどこにいるか

```
[ユーザーのブラウザ / スマホ]
        ↓ HTTP
    [ Nginx ]
     /       \
[Next.js]  [Hono バックエンド]
(フロントエンド+BFF)  (バックエンド)
```

フロントエンド（Next.js）の仕事は大きく2つです：

| 役割                            | 説明                                             |
| ------------------------------- | ------------------------------------------------ |
| **UI の描画**                   | React コンポーネントでユーザーに見える画面を作る |
| **BFF（Backend For Frontend）** | 画面に必要な形にデータを集約/整形して UI に渡す  |

> **BFF とは?**
> UI が使いやすい形にデータを整形する「フロントエンドの専用サーバー」機能です。
> このプロジェクトでは、Next.js の **Server Component / Route Handler / Server Actions** が BFF の役割を担います。

---

## 3. フロントエンドのレイヤー構造（最重要）

設計の核心は **「データをどこから取るか」を UI から切り離す** ことです。

```
┌────────────────────────────────────────────────────────┐
│ UI Layer（見た目）                                      │
│  src/app/ , src/components/                             │
│  - Server Component: usecase を直呼びして props 注入     │
│  - Client Component: Server Action / Route Handler を利用│
└───────────────┬────────────────────────────────────────┘
                │
                │（Server では usecase を直接呼べる）
                ▼
┌────────────────────────────────────────────────────────┐
│ Usecase Layer（server-only / 画面向け共通ロジック）       │
│  src/server/usecases/                                   │
│  - 複数 Repository をまたぐ集約・整形・権限/前提チェック   │
└───────────────┬────────────────────────────────────────┘
                │
                ▼
┌────────────────────────────────────────────────────────┐
│ Repository Layer（server-only / データ取得の窓口）        │
│  src/repositories/                                      │
│  - Spec（契約） + Impl（実装） + Provider（DI 入口）       │
└───────────────┬────────────────────────────────────────┘
                │
      ┌────────┴────────┐
      ▼                 ▼
┌───────────────┐   ┌───────────────────────────┐
│ Mock 実装      │   │ API 実装                    │
│ src/mocks/     │   │ Hono RPC Client（hc）        │
└───────────────┘   └───────────────────────────┘

（Client Component から server-only を直接 import できないため、下記の入口を使う）

┌────────────────────────────────────────────────────────┐
│ Entry Points（薄い入口）                                 │
│  - Server Actions: src/server/actions/（主に更新系）      │
│  - Route Handler : src/app/api/**/route.ts（主に取得系）  │
└────────────────────────────────────────────────────────┘
```

### 重要: server-only の境界

`src/repositories/*` と `src/server/usecases/*` は `import "server-only";` を付け、**Client Component から import できない**ようにしています。

- Server Component（`page.tsx` / `layout.tsx` など）は server-only を直接呼べる
- Client Component（`"use client"`）は server-only を直接呼べない
  - 代わりに **Server Actions を関数として呼ぶ**
  - もしくは **Route Handler を `fetch('/api/...')` で呼ぶ**

---

## 4. ディレクトリ構成（現行）

```
src/
├── app/
│   ├── [locale]/                 # next-intl によるロケール別ルーティング（ja/en/fr）
│   │   ├── (app)/                # ログイン後の画面（layout.tsx がヘッダー・ナビ等を集約）
│   │   │   ├── page.tsx          # ホーム（Server Component）
│   │   │   ├── faces/
│   │   │   ├── seeds/[seedId]/
│   │   │   ├── subscriptions/
│   │   │   ├── notifications/
│   │   │   └── settings/         # プロフィール編集（ProfileEditModal）を含む
│   │   ├── (auth)/                # 未ログイン時の画面
│   │   │   ├── sign-in/
│   │   │   └── sign-up/
│   │   └── auth-check/            # 動作確認用の一時ページ（AUTH_CHECK.md 参照）
│   └── api/                      # Route Handlers（BFF の HTTP 入口）
│       ├── hello/route.ts
│       ├── health/route.ts
│       ├── viewer/route.ts
│       ├── export/route.ts
│       └── detail/
│           ├── face/[faceId]/route.ts
│           └── seed/[seedId]/route.ts
│
├── components/                   # UI コンポーネント
│   ├── ui/
│   ├── auth/                     # SignInForm / SignUpForm
│   ├── home/
│   ├── face/
│   ├── seed/
│   ├── subscriptions/
│   ├── notifications/
│   └── settings/                 # ProfileEditModal など
│
├── server/                       # ★ server-only
│   ├── usecases/                 # 画面向けの集約・整形ロジック（Repository を呼ぶ）
│   └── actions/                  # Server Actions（Client から呼べる更新入口）
│
├── repositories/                 # ★ server-only: Spec/Impl/Provider
│   ├── provider.ts               # Provider 共通ヘルパー
│   ├── auth-repository.ts            # backendへ接続する実装のみ（モック無し。6-3 参照）
│   ├── user-profile-repository.ts    # backendへ接続する実装のみ（モック無し。6-3 参照）
│   ├── backend-health-repository.ts  # モックではなく実際に backend へ接続する先行例
│   ├── face-repository.ts            # モック実装のみ（バックエンド未実装）
│   ├── seed-repository.ts            # モック実装のみ（バックエンド未実装）
│   ├── user-repository.ts            # モック実装のみ（自分以外も含むユーザー一覧・検索用）
│   ├── subscription-repository.ts    # モック実装のみ（バックエンド未実装）
│   └── notification-repository.ts    # モック実装のみ（バックエンド未実装）
│
├── i18n/                         # next-intl 設定（routing.ts / messages/{ja,en,fr}.json）
├── mocks/                        # モックデータ（Repository が参照）
├── types/                        # 型定義（@tracen/contracts の型は必ずここ経由で再エクスポートする）
├── lib/                          # ユーティリティ・クライアント
│   ├── backend-client.ts         # Hono RPC クライアント（hc<AppType>）の生成
│   ├── api-error.ts              # ApiErrorKind / ApiResult<T>（6-4 参照）
│   ├── session.ts                # Cookie によるセッション管理
│   └── zod-error-map.ts          # Zod バリデーションエラーのi18n化
└── proxy.ts                      # Next.js middleware（next-intl のロケール振り分け）
```

> 補足: `search` はその後 `subscriptions` タブへ機能統合され、コンポーネントとしては廃止されています。
> `seed` / `settings` は新規に追加されたカテゴリです。

---

## 5. 命名規則（Spec/Impl）と async デフォルト（全レイヤー共通）

この章のルールは **Repository だけでなく**、将来追加される可能性がある **Worker / Service / Client（外部APIクライアント）** など、
「契約（interface/type）を定義して、複数の具体実装を差し替える」あらゆる箇所に適用します。

### 5-1. 契約（Spec）と実装（Impl）の命名

- 契約（インターフェース/型）: `XxxSpec`
  - 例: `FaceRepositorySpec` / `NotificationWorkerSpec` / `BackendClientSpec`
  - **末尾が `Spec` であること**がルール（`Repository` や `Worker` は役割が分かるように付けてOK）
- 具体実装（値）: `xxx...Impl`
  - 例: `faceMockRepositoryImpl` / `faceApiRepositoryImpl`
  - 例: `notificationMockWorkerImpl`（将来の Worker 例）
  - **末尾が `Impl` であること**がルール
- Factory（実装生成）: `createXxx...Impl()`
  - 例: `createFaceMockRepositoryImpl()`
  - 例: `createNotificationMockWorkerImpl()`（将来の Worker 例）
- Provider（DI 入口）: `getXxx...()`
  - 例: `getFaceRepository()` / `getNotificationWorker()`
  - Provider は「どの Impl を使うか」を閉じ込める場所（呼び出し側は `getXxx...(): XxxSpec` だけ知っていれば良い）

### 5-2. async（Promise）をデフォルトにする理由

モック期は同期っぽく実装できても、将来的に API 呼び出しや I/O が入ると **必ず非同期**になります。
そこで **Spec の段階で Promise を返す契約に統一**し、モックも必ず `async` で実装します。

- 呼び出し側（Usecase/Server Actions/Route Handler/UI）から見ると常に `await` するだけ
- 「モック期→API期」で呼び出し側の書き換えが最小になる

### 5-3. 例：Repository 以外（Worker）の場合（将来像）

たとえば「通知を送る Worker」を追加する場合も、同じルールで作れます。

```ts
import 'server-only';

import { createSingletonProvider } from '@/repositories/provider';

export type NotificationWorkerSpec = {
  send: (message: string) => Promise<void>;
};

export function createNotificationMockWorkerImpl(): NotificationWorkerSpec {
  return {
    send: async (_message) => {
      // モック: 何もしない
    },
  };
}

export const notificationMockWorkerImpl: NotificationWorkerSpec =
  createNotificationMockWorkerImpl();

export const getNotificationWorker = createSingletonProvider<NotificationWorkerSpec>(
  () => notificationMockWorkerImpl
);
```

> 補足: `createSingletonProvider` は現在 `src/repositories/provider.ts` に置いています。
> Provider パターンを Repository 以外でも多用するようになったら、より一般的な場所へ移すことも検討します。

---

## 6. Repository パターン（Factory + Provider）

Repository は「データ取得の窓口」です。
ポイントは **実装の選択（モック/API）を Provider に閉じ込める** ことです。

### 6-1. Spec（契約）と Impl（実装）

例: `src/repositories/face-repository.ts` の抜粋イメージ

```ts
import 'server-only';

import type { Face } from '@/types/face';
import { faces } from '@/mocks/faces';
import { createSingletonProvider } from '@/repositories/provider';

export type CreateFaceInput = Omit<Face, 'id' | 'userId'>;
export type UpdateFaceInput = Partial<CreateFaceInput>;

// 契約（Spec）: 必ず Promise を返す
export type FaceRepositorySpec = {
  listByUserId: (userId: string) => Promise<Face[]>;
  findById: (faceId: string) => Promise<Face | null>;
  create: (userId: string, input: CreateFaceInput) => Promise<Face>;
  update: (faceId: string, userId: string, input: UpdateFaceInput) => Promise<Face>;
  delete: (faceId: string, userId: string) => Promise<void>;
  listAll: () => Promise<Face[]>;
};

// モック実装（Impl）: モックでも async
export function createFaceMockRepositoryImpl(): FaceRepositorySpec {
  return {
    listByUserId: async (userId) => faces.filter((face) => face.userId === userId),
    findById: async (faceId) => faces.find((face) => face.id === faceId) ?? null,
    create: async (userId, input) => ({ id: `face-mock-${Date.now()}`, userId, ...input }),
    update: async (faceId, userId, input) => {
      const existing = faces.find((f) => f.id === faceId && f.userId === userId);
      return { id: faceId, userId, ...(existing ?? {}), ...input } as Face;
    },
    delete: async () => {
      // モック実装: no-op（実際には削除しない）
    },
    listAll: async () => faces,
  };
}

// 具体実装（Impl）
export const faceMockRepositoryImpl: FaceRepositorySpec = createFaceMockRepositoryImpl();

// Provider（DI の入口）: 実装の選択はここに閉じ込める
export const getFaceRepository = createSingletonProvider<FaceRepositorySpec>(
  () => faceMockRepositoryImpl
);
```

### 6-2. Provider 共通ヘルパー

Provider の「キャッシュ付き singleton」を毎回同じ形で書けるように、共通化ヘルパーを用意しています。

- `src/repositories/provider.ts`
  - `createSingletonProvider<T>(createImpl: () => T)`

### 6-3. モックを作らない Repository（ログイン中の本人専用データ）

`auth-repository.ts` / `user-profile-repository.ts` は、6-1 の Face の例と異なり **モック実装を持ちません**。

```ts
import 'server-only';

import { createBackendClient } from '@/lib/backend-client';
import { createSingletonProvider } from '@/repositories/provider';

export type UserProfileRepositorySpec = {
  getMyProfile: (accessToken: string) => Promise<UserProfile | null>;
};

// モックは作らず、最初から backend を呼ぶ実装のみを提供する
export function createUserProfileApiRepositoryImpl(): UserProfileRepositorySpec {
  return {
    getMyProfile: async (accessToken) => {
      const res = await createBackendClient(accessToken).api.v1.users.me.$get();
      // ...
    },
  };
}

export const getUserProfileRepository = createSingletonProvider<UserProfileRepositorySpec>(() =>
  createUserProfileApiRepositoryImpl()
);
```

この判断をする基準は、「**ログイン中の本人にしか意味がないデータかどうか**」です。自分のプロフィールやトークンは、他のユーザーの分をモックで再現しても検証に使えないため、最初から実際の backend 接続のみを実装します。

### 6-4. backend エラーのステータスコードベース判定（`ApiErrorKind` / `ApiResult<T>`）

実際に backend へ接続する Repository（6-3 のようなもの）では、backend が返す **HTTP ステータスコードを見て、成功/失敗と失敗の種別を判定** します。backend の生の `message`（多くは日本語・英語が混在し、i18n対応していない）は画面には出さず、ログ用途にのみ使います。

- `src/lib/api-error.ts`
  - `ApiErrorKind`: `VALIDATION` / `UNAUTHORIZED` / `FORBIDDEN` / `NOT_FOUND` / `CONFLICT` / `SERVER_ERROR` / `UNKNOWN` という、HTTPステータスの意味（セマンティクス）を表す汎用の分類
  - `classifyHttpStatus(status: number): ApiErrorKind`: ステータスコードをこの分類に変換する
  - `ApiResult<T>`: `{ success: true; data: T } | { success: false; errorKind: ApiErrorKind }` という、Repository/Usecase 層で使う汎用の Result 型（`ActionResult<T>` と同じ発想）

`ApiErrorKind` は「HTTPステータスの意味」の分類であり、「ビジネス上の意味」の分類ではありません。同じステータスコードでも機能によって出したい文言が違う場合、`ApiErrorKind` 自体は増やさず、Server Actions 層側で `errorKind` → i18n文言のマッピングを機能ごとに用意して吸収します（`src/server/actions/auth.ts` / `user-profile.ts` の `resolveXxxErrorMessage` 関数を参照）。

---

## 7. Usecase 層（server-only / 推奨の呼び出し口）

Usecase は、UI が欲しい形にデータを **集約・整形** する層です。

- Repository 呼び出しの **順序・並列化**
- 複数 Repository をまたぐ **集約**
- 画面向けに必要な形への **変換**

例: viewer context（`src/server/usecases/viewer.ts` のイメージ）

```ts
import 'server-only';

import { getCurrentUser } from './users';
import { listFacesByUserId } from './faces';

export async function getViewerContext() {
  const currentUser = await getCurrentUser();
  const myFaces = await listFacesByUserId(currentUser.id);
  return { currentUser, myFaces };
}
```

> ルール: **UI から直接 Repository を呼ばず、基本は Usecase を呼ぶ**

---

## 8. UI からの使い方（Server Component / Server Actions / Route Handler）

### 8-1. Server Component から（推奨）: Usecase を直呼びして props 注入

例: `src/app/[locale]/layout.tsx`（イメージ。実際は `getLayoutData()` がフェイス・シード・サブスクライブ等をまとめて集約している）

```tsx
import SideNav from '@/components/ui/SideNav';
import { getLayoutData } from '@/server/usecases/layout';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { myFaces } = await getLayoutData();
  return (
    <html lang="ja">
      <body>
        <SideNav faces={myFaces} />
        {children}
      </body>
    </html>
  );
}
```

- 初期表示（SSR）で必要なデータは Server Component 側で揃える
- Client Component には **props として渡す**

### 8-2. Client Component から更新する: Server Actions

例: `src/components/face/CreateFaceModal.tsx`（Client） → `src/server/actions/faces.ts`（Server）

```tsx
'use client';

import { useTransition } from 'react';
import { createFaceAction } from '@/server/actions/faces';

export function CreateFaceModal() {
  const [isPending, startTransition] = useTransition();

  const onSubmit = () => {
    startTransition(async () => {
      await createFaceAction({ name: '読書', isPrivate: false });
    });
  };

  return (
    <button onClick={onSubmit} disabled={isPending}>
      作成
    </button>
  );
}
```

`src/server/actions/faces.ts`（イメージ）

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { createFaceForCurrentUser } from '@/server/usecases/faces';

export async function createFaceAction(input) {
  const face = await createFaceForCurrentUser(input);
  revalidatePath('/');
  revalidatePath('/faces');
  return face;
}
```

- **Server Action は「関数として呼べるサーバー処理」**
- 主に **作成/更新/削除** などの「更新系」に使う

> 補足: フォーム入力を伴う更新系（サインイン・サインアップ・プロフィール編集など）は、`react-hook-form` + `zodResolver` でクライアント側の検証を行い、Server Action 側でも同じ contracts の Zod schema で再検証する構成にしています。実装例: `src/components/auth/SignInForm.tsx` → `src/server/actions/auth.ts`。

### 8-3. Client Component から読み取る: Route Handler + fetch

Client Component は server-only を import できないため、必要に応じて `/api/*` を `fetch` します。

例: DetailPanel のデータ取得（`src/app/api/detail/.../route.ts`）

```ts
import { NextResponse } from 'next/server';
import { getFaceDetailPanelData } from '@/server/usecases/detail-panel';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ faceId: string }> }) {
  const { faceId } = await params;
  const data = await getFaceDetailPanelData(faceId);
  return NextResponse.json(data);
}
```

Client 側（イメージ）

```tsx
'use client';

import { useEffect, useState } from 'react';

export function FaceDetail({ faceId }: { faceId: string }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`/api/detail/face/${faceId}`)
      .then((res) => res.json())
      .then(setData);
  }, [faceId]);

  return <div>{data ? 'loaded' : 'loading'}</div>;
}
```

---

## 9. Server Actions と Route Handler の違い（初学者向け）

どちらも「サーバーで動く処理」ですが、**呼び出し方と用途**が違います。

| 観点       | Server Actions                                                   | Route Handler（/api）                                       |
| ---------- | ---------------------------------------------------------------- | ----------------------------------------------------------- |
| 呼び出し方 | Client から **関数呼び出し**（Next.js が裏でリクエスト化）       | Client/外部 から **HTTP リクエスト**（`fetch('/api/...')`） |
| 主な用途   | **更新系**（作成/更新/削除） + `revalidatePath` などと相性が良い | **取得系**（Client で後から読むデータ）/ 外部連携も可能     |
| 返り値     | 直列化できる値（オブジェクト等）                                 | `Response`（JSON を返すのが一般的）                         |
| URL の有無 | URL を意識しない（関数として扱える）                             | URL が存在する（`/api/...` が入口）                         |

### 使い分けの目安（迷ったらこれ）

1. **Server Component で完結できる読み取り** → Usecase を直呼び（Route Handler 不要）
2. **Client がボタン押下などで更新する** → Server Actions
3. **Client が任意タイミングで読み取る必要がある**（DetailPanel など） → Route Handler + fetch

> ルール: Server Actions / Route Handler は **薄い入口**にする（中身は Usecase を呼ぶだけ）

---

## 10. 新しい契約インターフェース（RepositorySpec）を追加するときの手順

新しいデータ種別（例: `Post`）を増やすときは、次の順番で作ると迷いません。

### 10-1. 実装チェックリスト

1. **型を追加**
   - `src/types/post.ts` を追加
2. **モックデータを追加**
   - `src/mocks/posts.ts` を追加（モック期のみ）
3. **Repository を追加（Spec/Impl/Provider）**
   - `src/repositories/post-repository.ts` を追加
   - `PostRepositorySpec` を定義（全メソッド `Promise`）
   - `createPostMockRepositoryImpl()` を実装（モックでも `async`）
   - `postMockRepositoryImpl` を用意（`xxImpl` 命名）
   - `getPostRepository()` を Provider として公開（実装選択をここに閉じ込める）
4. **Usecase を追加**
   - `src/server/usecases/posts.ts` を追加
   - UI が欲しい粒度の関数（例: `listPostsForTimeline()`）を作る
5. **UI からの入口を決める**
   - 更新が必要 → `src/server/actions/posts.ts` に Server Actions
   - Client で fetch が必要 → `src/app/api/posts/**/route.ts` に Route Handler
   - Server Component で十分 → `page.tsx/layout.tsx` から Usecase 直呼び
6. **UI をつなぐ**
   - Server Component: Usecase 結果を props として Client に渡す
   - Client Component: Server Actions / Route Handler を使う（Repository/usecase は import しない）
7. **検証**
   - `pnpm --filter @tracen/frontend-bff typecheck`
   - `pnpm --filter @tracen/frontend-bff lint`

---

## 11. モックからバックエンド統合時の差し替え方

バックエンド統合時は Repository の **Impl を増やして Provider の選択を変える**のが基本です。

- 追加: `createXxxApiRepositoryImpl()`（`xxImpl` 命名）
- 変更: `getXxxRepository()` 内で「どの Impl を使うか」を切り替える

こうしておくと、Usecase や UI は **基本的に変更せず**に済みます。

実際に `auth-repository.ts` / `user-profile-repository.ts` はこの形で統合済みです（ただし6-3の通り、これらはモックを経由せず最初からAPI実装のみを用意しました）。Face・Seed・Subscription・Notification は今後、既存のモック実装に `xxxApiRepositoryImpl` を追加し、Provider の向き先を切り替える形で統合していく想定です。

---

## 12. まとめ：今日から意識すること

1. **Client Component から `src/repositories` / `src/server/usecases` を import しない**
   - 読み取り: Route Handler + fetch（または props 注入）
   - 更新: Server Actions

2. **契約は `xxSpec`、実装は `xxImpl`、モックでも async**

3. **Provider に DI を閉じ込め、Usecase に集約し、入口は薄く保つ**

4. **backend の生メッセージを画面に出さず、`ApiErrorKind`（ステータスコードの分類）を Server Actions 層で文言に変換する**（6-4 参照）
