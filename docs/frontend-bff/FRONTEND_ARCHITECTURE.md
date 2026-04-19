# MultiFace フロントエンド設計書

> 対象読者: フロントエンドを担当するメンバー（初学者含む）
> 目的: バックエンド統合時にスムーズに差し替えられるモックを作るための設計方針を共有する

## 1. このドキュメントの目的

現在のプロジェクトは **「モックデータで動く UI の再現」** を目標にしています。
しかし将来的には `ARCHITECTURE.md` に記載された Hono バックエンドと統合する予定です。

統合のときに「全部書き直し」になるのを防ぐために、**今のうちから「差し替えやすい設計」** で書いておくのがこのドキュメントの目的です。

## 2. 全体アーキテクチャの中でフロントエンドはどこにいるか

```
[ユーザーのブラウザ / スマホ]
        ↓ HTTP
    [ Nginx ]
     /       \
[Next.js]  [Hono バックエンド]
(フロントエンド)  (バックエンド)
```

フロントエンド（Next.js）の仕事は大きく2つです：

| 役割 | 説明 |
|---|---|
| **UI の描画** | React コンポーネントでユーザーに見える画面を作る |
| **BFF（Backend For Frontend）** | バックエンドの API を呼んでデータを取得し、画面に渡す |

> **BFF とは?**  
> UI が使いやすい形にデータを整形する「フロントエンドの専用サーバー」機能です。  
> Next.js の Server Component や Route Handler がこの役割を担います。

## 3. フロントエンドのレイヤー構造（最重要）

設計の核心は **「データをどこから取るか」をコンポーネントから切り離す** ことです。

```
┌───────────────────────────────────────┐
│  UI Layer（見た目）                    │
│  src/components/                       │
│  Server Component / Client Component   │
└───────────────┬───────────────────────┘
                │ データを要求
┌───────────────▼───────────────────────┐
│  Repository Layer（データ取得の窓口）  │
│  src/repositories/                     │
│  「モックから取る」か「APIから取る」かを│
│  ここだけで切り替える                  │
└───────────────┬───────────────────────┘
                │
       ┌────────┴────────┐
       ▼                 ▼
┌────────────┐    ┌─────────────────┐
│ Mock 実装  │    │ API 実装（将来） │
│ src/mocks/ │    │ Hono RPC Client │
└────────────┘    └─────────────────┘
```

### なぜこれが重要か？

**今（モック期）：**
```
コンポーネント → src/mocks/faces.ts から直接データを読む
```

**この設計だと統合時に：**
```
コンポーネント → src/repositories/face-repository.ts
               └→ 中身だけ「モック→API呼び出し」に差し替え
```

コンポーネント側は一切変えなくてよくなります。

## 4. ディレクトリ構成（推奨）

```
src/
├── app/                        # Next.js App Router のページ定義
│   ├── layout.tsx              # 全体レイアウト（BottomNavなど）
│   ├── page.tsx                # ホームタブ
│   ├── subscriptions/          # サブスクタブ
│   │   └── page.tsx
│   ├── search/                 # 検索タブ
│   │   └── page.tsx
│   ├── notifications/          # 通知タブ（MultiFace新規）
│   │   └── page.tsx
│   └── faces/                  # フェイス一覧タブ（MultiFace新規）
│       └── page.tsx
│
├── components/                 # UI コンポーネント
│   ├── ui/                     # 汎用（ボタン、アバター等）
│   ├── home/                   # ホームタブ専用
│   ├── face/                   # フェイス関連
│   ├── activity/               # アクティビティ関連
│   ├── subscriptions/          # サブスクタブ専用
│   ├── search/                 # 検索タブ専用
│   └── notifications/          # 通知タブ専用
│
├── repositories/               # ★ データ取得レイヤー（今回の設計の核心）
│   ├── face-repository.ts      # フェイスのCRUD
│   ├── activity-repository.ts  # アクティビティのCRUD
│   ├── user-repository.ts      # ユーザー情報の取得
│   └── subscription-repository.ts # サブスクライブ操作
│
├── mocks/                      # モックデータ（Repository が参照する）
│   ├── faces.ts
│   ├── activities.ts
│   ├── users.ts
│   └── subscriptions.ts
│
├── types/                      # 型定義
│   ├── activity.ts
│   ├── face.ts                 # topic.ts からリネーム
│   └── user.ts
│
└── lib/                        # ユーティリティ
    └── utils.ts
```

## 5. Repository パターンの実践

### 5-1. まず「インターフェース」を定義する

インターフェースとは「**この Repository は必ずこれらのメソッドを持つ**」という約束書きです。

```typescript
// src/repositories/face-repository.ts

import type { Face } from "@/types/face";

// 約束書き（インターフェース）
type FaceRepository = {
  // 指定ユーザーのフェイス一覧を取得する
  listByUserId: (userId: string) => Promise<Face[]>;
  // IDでフェイスを1件取得する
  findById: (faceId: string) => Promise<Face | null>;
  // フェイスを作成する
  create: (input: Omit<Face, "id">) => Promise<Face>;
};
```

### 5-2. 今はモックで実装する

```typescript
// src/repositories/face-repository.ts（続き）

import { mockFaces } from "@/mocks/faces"; // モックデータ

// 実際の処理（今はモックから取る）
export const faceRepository: FaceRepository = {
  listByUserId: async (userId) => {
    // 本来は await fetch(...) だが、今はモックをフィルタするだけ
    return mockFaces.filter((f) => f.userId === userId);
  },

  findById: async (faceId) => {
    return mockFaces.find((f) => f.id === faceId) ?? null;
  },

  create: async (input) => {
    // モックなので実際には保存せずダミーを返す
    return { ...input, id: crypto.randomUUID() };
  },
};
```

### 5-3. コンポーネント（Server Component）での使い方

```typescript
// src/app/faces/page.tsx（Server Component のまま）

import { faceRepository } from "@/repositories/face-repository";

const FacesPage = async () => {
  // Repository 経由でデータを取得（モックでも API でも呼び方は同じ）
  const faces = await faceRepository.listByUserId("current-user-id");

  return (
    <div>
      {faces.map((face) => (
        <FaceCard key={face.id} face={face} />
      ))}
    </div>
  );
};
```

### 5-4. 将来の API 統合時の変更イメージ

バックエンドと繋ぐときは **`faceRepository` の中身だけ** を書き換えます。

```typescript
// src/repositories/face-repository.ts（将来の API 版）

import { honoClient } from "@/lib/hono-client"; // Hono RPC クライアント

export const faceRepository: FaceRepository = {
  listByUserId: async (userId) => {
    // ← ここだけ変わる
    const res = await honoClient.faces.$get({ query: { userId } });
    return res.json();
  },
  // ...
};
```

**コンポーネント側（`FacesPage`）は一切変えなくてよい** のがこのパターンの利点です。

## 6. 型の共有戦略

### 現在（モック期）

フロントエンドが独自に `src/types/` で型を定義します。

```typescript
// src/types/face.ts
export type Face = {
  id: string;
  userId: string;
  name: string;          // フェイス名
  emoji?: string;        // アイコン絵文字
  description?: string;  // 詳細説明
  imageUrl?: string;     // フェイス画像
  isPrivate: boolean;    // 公開/非公開
};
```

### 将来（バックエンド統合後）

Hono バックエンドは `src/index.ts` から RPC 型定義をエクスポートします（ARCHITECTURE.md 参照）。
フロントエンドはそれを `import` するだけで型の二重定義がなくなります。

```typescript
// 将来のイメージ（今は実装しない）
import type { AppType } from "../../backend/src/index"; // バックエンドの型を直接参照
import { hc } from "hono/client";

export const honoClient = hc<AppType>("http://localhost:3001");
// honoClient は全 API エンドポイントに対して型安全にアクセスできる
```

> **今やること**: `src/types/` の型定義をバックエンドの設計（DB スキーマ）と**できるだけ揃えておく**。
> 後で「型が全然違う」という事態を防ぐためです。

## 7. MultiFace の画面構成とページ責務

`MULTI_FACE.md` の画面仕様をもとに、各ページの責務を整理します。

| タブ | ファイル | Server / Client | 主な責務 |
|---|---|---|---|
| フェイス一覧 | `app/faces/page.tsx` | Server | 自分のフェイス一覧を取得して表示 |
| ホーム | `app/page.tsx` | Server | 自分の全アクティビティを取得して表示 |
| サブスク | `app/subscriptions/page.tsx` | Server | サブスク中フェイスのアクティビティを取得 |
| 通知 | `app/notifications/page.tsx` | Server | リンク・サブスク通知を取得して表示 |
| 検索 | `app/search/page.tsx` | Server + Client | 入力 UI は Client、結果取得は Server |

### Server Component と Client Component の使い分け

```
Server Component（デフォルト）       Client Component（"use client" が必要）
─────────────────────────────────    ─────────────────────────────────────
・データ取得（Repository 呼び出し）  ・useState / useEffect を使う
・SEO やパフォーマンスに有利          ・ボタンクリック等のイベント処理
・API キーなど秘匿情報を扱える        ・モーダル開閉などのインタラクション
                                      ・フォーム入力
```

**基本方針: ページ（`page.tsx`）は Server Component のまま保つ。**
インタラクティブな部分だけ Client Component として切り出す。

```tsx
// 良い例: Server と Client を適切に分離
// app/page.tsx（Server Component）
const HomePage = async () => {
  const activities = await activityRepository.listByUserId("current-user-id");
  return (
    <>
      {/* データ取得は Server 側で完了 */}
      <ActivityFeed activities={activities} />
      {/* インタラクティブな部分だけ Client Component */}
      <NewActivityFAB />
    </>
  );
};
```

## 8. 現在のモックからの移行ロードマップ

### Phase 1（現在）: モックで UI を完成させる

- `src/mocks/` にモックデータを充実させる
- `src/repositories/` を作成し、**モックを呼ぶ Repository** を実装する
- `src/components/` の UI を仕様通りに作り込む
- Tricle の命名（`Topic`）を MultiFace の命名（`Face`）に統一する

```
優先タスク:
[ ] src/types/face.ts を作成（topic.ts をベースにリネーム・拡張）
[ ] src/repositories/ を作成し、各 Repository の mock 実装を用意
[ ] ページコンポーネントが mocks/ を直接 import している箇所を
    repositories/ 経由に置き換える
[ ] MultiFace の新画面（フェイス一覧・通知タブ）を追加する
```

### Phase 2（バックエンド統合時）: Repository の中身だけ差し替える

- `src/lib/hono-client.ts` を作成し、Hono RPC クライアントを初期化
- 各 `src/repositories/*.ts` の実装を「モック→API呼び出し」に変える
- `src/types/` の型をバックエンドのエクスポート型に差し替える

```
変更範囲:
[ ] src/lib/hono-client.ts（新規）
[ ] src/repositories/*.ts（中身の差し替えのみ）
[ ] src/types/*.ts（バックエンドの型に合わせて調整 コンポーネント・ページは原則変更なし ---
```

## 9. 命名の統一ルール（Tricle → MultiFace）

既存コードは Tricle の命名（`topic`）を使っています。MultiFace では `face` に統一します。

| Tricle（旧） | MultiFace（新） | 備考 |
|---|---|---|
| `Topic` 型 | `Face` 型 | `src/types/face.ts` |
| `topicId` | `faceId` | フィールド名 |
| `src/mocks/topics.ts` | `src/mocks/faces.ts` | ファイルリネーム |
| `src/components/topic/` | `src/components/face/` | ディレクトリ |
| `TopicChip` | `FaceChip` | コンポーネント名 |
| `/topics/` | `/faces/` | URL パス |

> 一気にリネームせず、**新機能から順次 MultiFace の命名で作る** のが現実的です。

## 10. まとめ：今日から意識すること

1. **コンポーネントの中でモックを直接 import しない**
   → 必ず `src/repositories/` を経由する

2. **`page.tsx` は Server Component のまま保つ**
   → `"use client"` はインタラクティブな子コンポーネントにだけ付ける

3. **型は `src/types/` で一元管理し、バックエンドの設計と揃えておく**
   → 後で型の乖離が起きないようにする

4. **命名は MultiFace に合わせて新規ファイルから統一する**
   → `Face`・`faceId` を使い、`Topic`・`topicId` は段階的に移行する
