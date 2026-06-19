# `contracts` パッケージ設計指針

## 1. 概要と存在目的

`contracts` パッケージは、フロントエンド（Frontend）とバックエンド（Backend）の間に交わされる「通信の契約（規格）」を定義するための共有パッケージです。

> このリポジトリでは、パッケージ名は `@tracen/contracts` として利用しています。

このパッケージの主な目的は以下の通りです。

- **信頼できる唯一の情報源 (Single Source of Truth):** APIの入出力型を一つの場所で管理し、フロントとバックの型の不一致を物理的に排除します。
- **疎結合なアーキテクチャの実現:** バックエンドの内部実装（DB構造など）をフロントエンドから隠蔽し、変更の影響範囲を限定します。
- **セキュリティの担保:** フロントエンドに公開して良いデータ（DTO）と、バックエンドのみで扱うべき機密データ（Entity）を型レベルで分離します。

---

## 2. 依存関係の構造

パッケージ間の依存方向は以下の通りです。`contracts` はフロント/バックの内部コードに依存しない「末端パッケージ」として定義します（Zodなどの外部ライブラリへの依存は許容）。

```text
[ Frontend ] ────┐
                 ▼
          [ contracts ] (共有: DTO / Schema / Validation)
                 ▲
[ Backend ]  ────┘

```

- **Frontend → contracts:** APIを叩く際の型補完、フォームのバリデーション、レスポンスの型定義に使用。
- **Backend → contracts:** APIリクエストのパース、レスポンスの整形、ドメインエンティティのベースとして使用。
- **contracts → backend (禁止):** バックエンドの内部コードを共有パッケージが参照してはいけません。
- **contracts → frontend (禁止):** フロントエンドの内部コードを共有パッケージが参照してはいけません。

---

## 3. 記述する内容（何を入れるべきか）

`contracts` には、**境界を越えてやり取りされるデータ（DTO）**とその**検証ルール**を記述します。

### 3.1. Request DTO（入力）

クライアントからサーバーへ送るデータのスキーマです。

- 例: `SignUpRequestSchema`
- 内容: 生パスワード、メールアドレス、ユーザー名など。

### 3.2. Response DTO（出力）

サーバーからクライアントへ返すデータのスキーマです。

- 例: `UserResponseSchema`
- 内容: サーバーで生成されたID、作成日時、公開可能なプロフィール情報など。
- **重要:** パスワードハッシュなどの機密情報は、ここには**絶対に含まない**でください。

### 3.3. 共通バリデーションルール

「パスワードは8文字以上」「メールアドレスの形式」といった、フロントとバックの両方で適用すべき不変のルールを記述します。

---

## 4. 実装パターン（Zodによる継承）

コードの重複を避けつつ、バックエンド専用の「エンティティ」と「契約」を分離するために、Zodの拡張機能を利用します。

### 例: ユーザー定義の分離

#### 【contracts パッケージ】

```typescript
// containers/apps/contracts/src/domain/user/user.ts

import { z } from 'zod';

import {
  EmailSchema,
  IsoDateTimeStringSchema,
  UuidSchema,
  type Uuid,
} from '../../shared/primitives';

// 1. 公開される基本情報の定義 (DTO)
export const UserIdSchema = UuidSchema;
export type UserId = Uuid;

export const UserResponseSchema = z
  .object({
    id: UserIdSchema,
    email: EmailSchema,
    name: z.string().min(1),
    createdAt: IsoDateTimeStringSchema,
  })
  .strict();
export type UserResponse = z.infer<typeof UserResponseSchema>;
```

```typescript
// containers/apps/contracts/src/domain/auth/auth.sign-up.request.ts

import { z } from 'zod';

import { EmailSchema, UserPasswordSchema } from '../../shared';

// 2. 作成リクエストの定義
export const SignUpRequestSchema = z.object({
  email: EmailSchema,
  name: z.string().min(1),
  password: UserPasswordSchema, // 生パスワード
});
export type SignUpRequest = z.infer<typeof SignUpRequestSchema>;
```

#### 【backend パッケージ】

```typescript
// containers/apps/backend/src/features/user/domain/users.entity.ts
import { z } from 'zod';
import { UserResponseSchema } from '@tracen/contracts';

// 3. 内部でのみ扱うドメインエンティティ
// contracts のスキーマを継承して、機密情報を追加する
export const UserEntitySchema = UserResponseSchema.extend({
  password_hash: z.string().min(1), // バックエンド専用の秘密情報
}).strict();
export type UserEntity = z.infer<typeof UserEntitySchema>;
```

---

## 5. 命名規則の推奨

用途を明確にするため、以下のサフィックス（接尾辞）を使い分けます。

| 種類             | Zod変数名           | 推論される型名 | 配置場所    |
| ---------------- | ------------------- | -------------- | ----------- |
| **公開用データ** | `XxxResponseSchema` | `XxxResponse`  | `contracts` |
| **入力用データ** | `XxxRequestSchema`  | `XxxRequest`   | `contracts` |
| **内部用モデル** | `XxxEntitySchema`   | `XxxEntity`    | `backend`   |

---

## 6. セキュリティ上の利点

この構成を採用することで、「バックエンド側でパスワードハッシュを含むオブジェクト（Entity）を誤ってそのまま返そうとした場合」に、TypeScriptの型チェック（またはHonoのバリデータ）がエラーを吐くようになります。

> **「意図的に変換しない限り、秘密の情報は境界を越えられない」**

というガードレールをシステムに組み込むことが、この設計の最大の価値です。

---

## 7. 各パッケージでの拡張と利用 (Extension Strategy)

`contracts` で定義されたスキーマは、単なる「静的な定義」ではなく、各パッケージで目的（ドメイン知識の追加やUI状態の管理）に応じて**拡張して使用すること**を前提としています。

### 7.1. Backend：ドメイン知識の注入（Entity化）

バックエンドでは、`contracts` のレスポンス型をベースに、永続化に必要な機密情報やドメイン固有のロジックを付与して「ドメインエンティティ」を作成します。

**実装例:**

```typescript
// containers/apps/backend/src/features/user/domain/users.entity.ts
import { z } from 'zod';
import { UserResponseSchema } from '@tracen/contracts';

// contractsの定義を拡張して、永続化に必要な機密情報を追加
export const UserEntitySchema = UserResponseSchema.extend({
  password_hash: z.string().min(1),
}).strict();

export type UserEntity = z.infer<typeof UserEntitySchema>;
```

### 7.2. Frontend：表示用データの付与（View Model化）

フロントエンドでは、APIから受け取った `contracts` の型に、画面表示の制御に必要な「UI状態（State）」を付与して「View Model」として扱います。

**実装例:**

```typescript
import { UserResponse } from '@tracen/contracts';

// contractsの型に、UI制御用のフラグを交差型で追加
export type UserViewModel = UserResponse & {
  isSelected: boolean;
  isDeleting: boolean;
};
```

> 補足: このリポジトリではフロント（例: frontend-bff）でも `@tracen/contracts` を import して利用しています。

---

## 8. 拡張を行う際のルール

1. **破壊的変更の禁止:** `contracts` のベースとなるスキーマから、既存のフィールドを削除したり、型を変更したりする拡張（`omit` や `pick` による縮小を除く）は避けてください。これはフロントとバックの互換性を壊す原因になります。
2. **拡張の方向性:**

- **Backendでの拡張:** 主に「機密情報の追加」や「DB操作用のプロパティ追加」。
- **Frontendでの拡張:** 主に「表示制御フラグ」や「計算済みプロパティ（フルネームなど）」の追加。

3. **変換の責務:**

- `Entity` (Backend) → `Response` (contracts): **UseCase層**で変換を行う。
- `Response` (contracts) → `View Model` (Frontend): **HooksやStore**で変換を行う。

---

## 9. まとめ：この構成によるメリット

- **DRYの維持:** `id` や `email` といった共通フィールドの定義を一箇所に集約しつつ、各層に必要な独自の情報を柔軟に追加できます。
- **カプセル化:** フロントエンドはバックエンドの `Entity` 構造（`password_hash` 等）を知ることができず、バックエンドはフロントエンドのUI状態（`isSelected` 等）に依存しません。
- **型安全なマッピング:** Zodの `.extend()` を使うことで、ベースの型が変更された際、拡張先の Entity や View Model にも自動的に変更が波及し、コンパイルエラーによって修正漏れを防ぐことができます。

---

## 10. 実装ルール（現在の実装に準拠）

このセクションは、`containers/apps/contracts/src` の現在の構成・実装に合わせたルールです。

### 10.1. `domain` と `shared` の責務

- `domain` には、基本的に「契約（Request / Response）」を定義します。
- `shared` には、プロジェクト全体で共通利用できる基礎的な要素（例: `EmailSchema`, `UuidSchema`, `UserPasswordSchema`）を定義します。
- `domain` の契約は `shared` のスキーマ・プリミティブを組み合わせて構築し、重複定義を避けます。

### 10.2. `domain` 内のファイル分割（Request / Response）

- `domain` 内の契約は、**リクエストとレスポンスをファイルで分離**します。
  - リクエスト: `xx.request.ts`（例: `auth.sign-up.request.ts`, `user.request.ts`）
  - レスポンス: `xx.ts`（例: `auth.sign-up.ts`, `user.ts`）
- レスポンス側は、バックエンド内で Entity に `.extend()` して利用する前提のため、ファイル名をプレーン（`.ts`）にしています。

### 10.3. `index.ts` によるディレクトリ単位の import

- 各ディレクトリに `index.ts` を配置し、ディレクトリ単位で export します。
  - `src/index.ts` は `domain` と `shared` をまとめて export
  - `src/domain/index.ts` は `auth` / `user` を export
  - `src/domain/auth/index.ts` / `src/domain/user/index.ts` は各契約ファイルを export
  - `src/shared/index.ts` は shared 内の定義を export
- これにより、利用側は原則として `@tracen/contracts` から必要な型・スキーマを import できます。

---

## 11. frontend-bff における `@tracen/contracts` の利用ルール

`frontend-bff` 内では、`@tracen/contracts` の参照方法を以下のルールで統一します。

### 11.1. 型定義は `src/types/` 経由で import する

`@tracen/contracts` の型（`type` キーワードで参照するもの）は、`frontend-bff/src/types/` を通じて re-export し、アプリケーションコードは `@/types/*` から import します。

```
@tracen/contracts  →  src/types/*  →  アプリケーションコード
```

### 11.2. re-export 時の命名規則

`src/types/` で re-export する際は、以下のルールで型名を変換します。

| 種類 | contracts での名前 | src/types/ での名前 | 規則 |
|---|---|---|---|
| レスポンス型 | `FaceResponse` | `Face` | `Response` サフィックスを除去 |
| レスポンス型 | `UserResponse` | `User` | `Response` サフィックスを除去 |
| レスポンス型 | `AuthSignUpResponse` | `AuthSignUp` | `Response` サフィックスを除去 |
| リクエスト型 | `CreateFaceRequest` | `CreateFaceRequest` | そのまま（変更しない） |
| リクエスト型 | `SignUpRequest` | `SignUpRequest` | そのまま（変更しない） |

**理由:**
- `Response` はサーバー・API 側の概念。フロントエンドから見れば単にドメインオブジェクトなので除去する
- `Request` はサーバーへ送るデータであることを示す有効な情報のため、そのまま残す
- contracts の命名規則（`XxxResponse` / `XxxRequest`）が異なるため衝突は発生しない

**`src/types/` のファイル構成例:**

```ts
// src/types/face.ts
export type { FaceResponse as Face, CreateFaceRequest } from '@tracen/contracts';

// src/types/auth.ts
export type {
  SignUpRequest,
  SignInRequest,
  AuthSignUpResponse as AuthSignUp,
  AuthSignInResponse as AuthSignIn,
  AuthRefreshResponse as AuthRefresh,
} from '@tracen/contracts';

// src/types/user.ts
export type { UserResponse as User } from '@tracen/contracts';

// src/types/user-profile.ts
export type { UserProfileResponse as UserProfile } from '@tracen/contracts';
```

### 11.3. Zod スキーマは `@tracen/contracts` から直接 import する

Zod スキーマ（`*Schema` という変数名のランタイム値）は `src/types/` ではなく `@tracen/contracts` から直接 import します。型ではなく実行時の値であるため、`src/types/` に置くとセマンティクスがずれるためです。

```ts
// ✅ スキーマ: @tracen/contracts から直接
import { CreateFaceRequestSchema } from '@tracen/contracts';

// ✅ 型: src/types/ 経由（Response は除去、Request はそのまま）
import type { Face, CreateFaceRequest } from '@/types/face';
```

### 11.4. この運用をする理由

- `@tracen/contracts` の命名規則（`FaceResponse`, `SignUpRequest` など）をアプリケーション内に直接漏らさない
- contracts の型名が変わった場合の変更箇所を `src/types/` に集約し、影響範囲を最小化する
