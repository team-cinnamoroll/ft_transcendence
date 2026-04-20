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

現在のプロジェクトは **「モックデータで動く UI の再現」** を目標にしています。
ただし将来的には [ARCHITECTURE.md](../architecture/ARCHITECTURE.md) に記載された Hono バックエンドと統合する予定です。

統合のときに「全部書き直し」になるのを防ぐために、**今のうちから「差し替えやすい設計」** で書いておくのがこのドキュメントの目的です。

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

| 役割 | 説明 |
|---|---|
| **UI の描画** | React コンポーネントでユーザーに見える画面を作る |
| **BFF（Backend For Frontend）** | 画面に必要な形にデータを集約/整形して UI に渡す |

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
│ Mock 実装      │   │ API 実装（将来）            │
│ src/mocks/     │   │ Hono RPC Client / fetch    │
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
├── app/                          # Next.js App Router
│   ├── layout.tsx                # 全体レイアウト（Server Component）
│   ├── page.tsx                  # ホーム（Server Component）
│   └── api/                      # Route Handlers（BFF の HTTP 入口）
│       ├── viewer/route.ts
│       └── detail/
│           ├── face/[faceId]/route.ts
│           └── activity/[activityId]/route.ts
│
├── components/                   # UI コンポーネント
│   ├── ui/
│   ├── home/
│   ├── face/
│   ├── subscriptions/
│   ├── search/
│   └── notifications/
│
├── server/                       # ★ server-only
│   ├── usecases/                 # 画面向けの集約・整形ロジック（Repository を呼ぶ）
│   └── actions/                  # Server Actions（Client から呼べる更新入口）
│
├── repositories/                 # ★ server-only: Spec/Impl/Provider
│   ├── provider.ts               # Provider 共通ヘルパー
│   ├── face-repository.ts
│   ├── activity-repository.ts
│   ├── user-repository.ts
│   ├── subscription-repository.ts
│   └── notification-repository.ts
│
├── mocks/                        # モックデータ（Repository が参照）
├── types/                        # 型定義
└── lib/                          # ユーティリティ
```

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
import "server-only";

import { createSingletonProvider } from "@/repositories/provider";

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

export const getNotificationWorker =
  createSingletonProvider<NotificationWorkerSpec>(() => notificationMockWorkerImpl);
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
import "server-only";

import type { Face } from "@/types/face";
import { faces } from "@/mocks/faces";
import { createSingletonProvider } from "@/repositories/provider";

export type CreateFaceInput = Omit<Face, "id" | "userId">;

// 契約（Spec）: 必ず Promise を返す
export type FaceRepositorySpec = {
  listByUserId: (userId: string) => Promise<Face[]>;
  findById: (faceId: string) => Promise<Face | null>;
  create: (userId: string, input: CreateFaceInput) => Promise<Face>;
  listAll: () => Promise<Face[]>;
};

// モック実装（Impl）: モックでも async
export function createFaceMockRepositoryImpl(): FaceRepositorySpec {
  return {
    listByUserId: async (userId) => faces.filter((face) => face.userId === userId),
    findById: async (faceId) => faces.find((face) => face.id === faceId) ?? null,
    create: async (userId, input) => ({ id: `face-mock-${Date.now()}`, userId, ...input }),
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

---

## 7. Usecase 層（server-only / 推奨の呼び出し口）

Usecase は、UI が欲しい形にデータを **集約・整形** する層です。

- Repository 呼び出しの **順序・並列化**
- 複数 Repository をまたぐ **集約**
- 画面向けに必要な形への **変換**

例: viewer context（`src/server/usecases/viewer.ts` のイメージ）

```ts
import "server-only";

import { getCurrentUser } from "./users";
import { listFacesByUserId } from "./faces";

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

例: `src/app/layout.tsx`

```tsx
import SideNav from "@/components/ui/SideNav";
import { getViewerContext } from "@/server/usecases/viewer";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { myFaces } = await getViewerContext();
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
"use client";

import { useTransition } from "react";
import { createFaceAction } from "@/server/actions/faces";

export function CreateFaceModal() {
  const [isPending, startTransition] = useTransition();

  const onSubmit = () => {
    startTransition(async () => {
      await createFaceAction({ name: "読書", isPrivate: false });
    });
  };

  return <button onClick={onSubmit} disabled={isPending}>作成</button>;
}
```

`src/server/actions/faces.ts`（イメージ）

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createFaceForCurrentUser } from "@/server/usecases/faces";

export async function createFaceAction(input) {
  const face = await createFaceForCurrentUser(input);
  revalidatePath("/");
  revalidatePath("/faces");
  return face;
}
```

- **Server Action は「関数として呼べるサーバー処理」**
- 主に **作成/更新/削除** などの「更新系」に使う

### 8-3. Client Component から読み取る: Route Handler + fetch

Client Component は server-only を import できないため、必要に応じて `/api/*` を `fetch` します。

例: DetailPanel のデータ取得（`src/app/api/detail/.../route.ts`）

```ts
import { NextResponse } from "next/server";
import { getFaceDetailPanelData } from "@/server/usecases/detail-panel";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ faceId: string }> }) {
  const { faceId } = await params;
  const data = await getFaceDetailPanelData(faceId);
  return NextResponse.json(data);
}
```

Client 側（イメージ）

```tsx
"use client";

import { useEffect, useState } from "react";

export function FaceDetail({ faceId }: { faceId: string }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`/api/detail/face/${faceId}`)
      .then((res) => res.json())
      .then(setData);
  }, [faceId]);

  return <div>{data ? "loaded" : "loading"}</div>;
}
```

---

## 9. Server Actions と Route Handler の違い（初学者向け）

どちらも「サーバーで動く処理」ですが、**呼び出し方と用途**が違います。

| 観点 | Server Actions | Route Handler（/api） |
|---|---|---|
| 呼び出し方 | Client から **関数呼び出し**（Next.js が裏でリクエスト化） | Client/外部 から **HTTP リクエスト**（`fetch('/api/...')`） |
| 主な用途 | **更新系**（作成/更新/削除） + `revalidatePath` などと相性が良い | **取得系**（Client で後から読むデータ）/ 外部連携も可能 |
| 返り値 | 直列化できる値（オブジェクト等） | `Response`（JSON を返すのが一般的） |
| URL の有無 | URL を意識しない（関数として扱える） | URL が存在する（`/api/...` が入口） |

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

## 11. モックからバックエンド統合時の差し替え方（将来）

バックエンド統合時は Repository の **Impl を増やして Provider の選択を変える**のが基本です。

- 追加: `createXxxApiRepositoryImpl()`（`xxImpl` 命名）
- 変更: `getXxxRepository()` 内で「どの Impl を使うか」を切り替える

こうしておくと、Usecase や UI は **基本的に変更せず**に済みます。

---

## 12. まとめ：今日から意識すること

1. **Client Component から `src/repositories` / `src/server/usecases` を import しない**
   - 読み取り: Route Handler + fetch（または props 注入）
   - 更新: Server Actions

2. **契約は `xxSpec`、実装は `xxImpl`、モックでも async**

3. **Provider に DI を閉じ込め、Usecase に集約し、入口は薄く保つ**
