# ログイン導線 実装計画

> ゴール: サインアップ／ログイン／ログアウトの画面と仕組みを実装し、バックエンドの認証APIと実際につながる状態にする

---

## 0. まず言葉の説明（知っている人は読み飛ばしてOK）

| 用語                    | かんたんな説明                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Cookie                  | ブラウザに保存される小さなデータ。サーバーが「保存して」と指示し、以後のリクエストで自動的に一緒に送られてくる。    |
| httpOnly Cookie         | ブラウザ内の JavaScript からは読み取れない Cookie。トークンのような重要な情報を置くのに向いている（盗まれにくい）。 |
| アクセストークン（JWT） | 「私はログイン済みです」を証明する短命の通行証。バックエンドAPIを呼ぶときに一緒に送る。                             |
| リフレッシュトークン    | アクセストークンが切れたときに、再発行してもらうための通行証。アクセストークンより長持ちする。                      |
| セッション              | 「今このブラウザは誰としてログイン中か」という状態のこと。今回はこれを Cookie で持たせる。                          |
| モック                  | 本物のバックエンドの代わりに使う、あらかじめ用意した仮のデータ。                                                    |

---

## 1. 背景（なぜこの計画が必要か）

現在の frontend-bff は、ほぼ全ての画面が **モックデータ** で動いている。
`getCurrentUser()`（[repositories/user-repository.ts](../../containers/apps/frontend-bff/src/repositories/user-repository.ts)）は `mocks/users.ts` の固定ユーザー（山田太郎）を常に返し、フェイス・アクティビティなどのモックデータもすべてこの固定ユーザーの ID に紐づいている。

一方バックエンド（`containers/apps/backend`）にはサインアップ・ログイン・ログアウト・トークン再発行のAPIがすでに実装済みで動作確認も取れている（詳細は [BACKEND_ARCHITECTURE.md](../architecture/BACKEND_ARCHITECTURE.md)）。

ここでそのまま「ログインだけ本物のバックエンドにつなぐ」と、ログインした人の ID は本物の（バックエンドが発行した）ID になる。しかしフェイスやアクティビティなどのモックデータは相変わらず固定の山田太郎の ID しか知らないため、**ログインした人と、画面に表示される中身が一致しなくなる**（＝モックが機能しなくなる）という問題が起きる。

## 2. 方針（結論）

**「ログインしているかどうか（認証）」と「画面にどのデータを表示するか（コンテンツの持ち主）」を、いったん別々のものとして扱う。**

- ログイン・サインアップ・ログアウトの仕組みは、最初から本物のバックエンドAPIにつなぐ（この部分に関してはモック実装を作らない）。
- 画面に表示するフェイスやアクティビティは、これまで通り `getCurrentUser()` が返す固定ユーザーのモックデータを使い続ける。**`getCurrentUser()` の中身は今回変更しない。**
- 「今ログイン中の本人（バックエンドのユーザー）」の情報は、`getCurrentUser()` とは別の新しい仕組み（後述の `getAuthSession()`）で取得する。

この2つを分けておくことで、ログイン機能を先に本物につなぎつつ、フェイス・アクティビティなど他の画面のモックを壊さずに済む。

| 項目                                 | 今回どうするか                              |
| ------------------------------------ | ------------------------------------------- |
| サインアップ／ログイン／ログアウト   | バックエンドAPIに接続する（本物）           |
| ログイン中かどうかの判定             | Cookie に保存したトークンで判定する（本物） |
| フェイス・アクティビティ等の表示内容 | 今まで通りモックのまま（変更しない）        |
| `getCurrentUser()` の中身            | 変更しない                                  |

> ⚠️ 補足: 将来「ログインした人のフェイスが本当に表示される」ようにするには、`user-repository` や `face-repository` などを API 実装に差し替える別の作業が必要になる。これは今回のスコープ外とする（[CRUD.md](CRUD.md) 参照）。

## 3. 全体像

```
[ログイン画面] --(メール・パスワード送信)--> [Server Action]
                                                  │
                                                  ▼
                                    [server/usecases/auth.ts]
                                                  │
                                                  ▼
                                   [repositories/auth-repository.ts]
                                    （常にバックエンドAPIを呼ぶ）
                                                  │
                                                  ▼
                                      backend の /api/v1/auth/*
                                                  │
                                   accessToken / refreshToken を受け取る
                                                  │
                                                  ▼
                            httpOnly Cookie に保存する（= ログイン状態の保存）
```

画面表示側（フェイス一覧など）はこの流れとは別に、今まで通り `getCurrentUser()` → モックデータ、という流れのまま変わらない。

## 4. 新規に作るもの・変更するもの

| 種類                       | パス                                                | 内容                                                                                                         |
| -------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 型（contracts）            | （追加不要）                                        | サインアップ／ログイン等の型は `@tracen/contracts` にすでにある（`AuthSignUpRequest` など）                  |
| Repository                 | `src/repositories/auth-repository.ts`（新規）       | サインアップ／ログイン／ログアウト／トークン再発行をバックエンドAPIに問い合わせる窓口                        |
| セッション用ユーティリティ | `src/lib/session.ts`（新規）                        | Cookie にトークンを保存・削除・読み取りする関数（server-only）                                               |
| Usecase                    | `src/server/usecases/auth.ts`（新規）               | サインアップ／ログイン／ログアウトの一連の処理をまとめる。ログイン中かの判定 `getAuthSession()` もここに置く |
| Server Actions             | `src/server/actions/auth.ts`（新規）                | フォームから呼べる「サインアップする」「ログインする」「ログアウトする」の入口                               |
| ページ                     | `src/app/[locale]/sign-up/page.tsx`（新規）         | サインアップ画面                                                                                             |
| ページ                     | `src/app/[locale]/sign-in/page.tsx`（新規）         | ログイン画面                                                                                                 |
| コンポーネント             | `src/components/auth/SignUpForm.tsx`（新規）        | サインアップフォーム（Client Component）                                                                     |
| コンポーネント             | `src/components/auth/SignInForm.tsx`（新規）        | ログインフォーム（Client Component）                                                                         |
| 既存コンポーネント変更     | `src/components/ui/AccountMenu.tsx`                 | ログイン中はログアウトボタンを表示。未ログインならログイン画面への導線を表示                                 |
| i18n                       | `src/i18n/messages/{ja,en,fr}.json`                 | `signUp` / `signIn` / 関連メッセージの名前空間を追加                                                         |
| Storybook                  | `src/components/auth/stories/*.stories.tsx`（新規） | フォームの見た目確認用                                                                                       |

`getCurrentUser()` を含む以下のファイルは **変更しない**:

- `src/repositories/user-repository.ts`
- `src/repositories/face-repository.ts` / `seed-repository.ts` / `subscription-repository.ts` / `notification-repository.ts`
- `src/mocks/*`

## 5. フェーズ別の進め方

### Phase 0: ブランチ準備

```bash
git checkout -b feat/auth-flow
```

### Phase 1: `auth-repository` を作る（バックエンドと話す窓口）

既存の `repositories/face-repository.ts` などと同じ形（Spec / Impl / Provider）に揃える。他の repository と違い、モック実装は用意しない（ログイン処理をモックで再現しても意味が薄いため）。

```ts
// src/repositories/auth-repository.ts
import 'server-only';

import type {
  AuthSignUpRequest,
  AuthSignInRequest,
  AuthSignUpResponse,
  AuthSignInResponse,
  AuthRefreshResponse,
} from '@tracen/contracts';
import { createBackendClient } from '@/lib/backend-client';
import { createSingletonProvider } from '@/repositories/provider';

export type AuthRepositorySpec = {
  signUp: (input: AuthSignUpRequest) => Promise<AuthSignUpResponse>;
  signIn: (input: AuthSignInRequest) => Promise<AuthSignInResponse>;
  refresh: (refreshToken: string) => Promise<AuthRefreshResponse>;
  signOut: (refreshToken: string) => Promise<void>;
};

export function createAuthApiRepositoryImpl(): AuthRepositorySpec {
  return {
    signUp: async (input) => {
      const res = await createBackendClient().api.v1.auth['sign-up'].$post({ json: input });
      return res.json();
    },
    signIn: async (input) => {
      const res = await createBackendClient().api.v1.auth['sign-in'].$post({ json: input });
      return res.json();
    },
    refresh: async (refreshToken) => {
      const res = await createBackendClient().api.v1.auth.refresh.$post({
        json: { refreshToken },
      });
      return res.json();
    },
    signOut: async (refreshToken) => {
      await createBackendClient().api.v1.auth.refresh.$delete({ json: { refreshToken } });
    },
  };
}

export const authApiRepositoryImpl: AuthRepositorySpec = createAuthApiRepositoryImpl();

export const getAuthRepository = createSingletonProvider<AuthRepositorySpec>(
  () => authApiRepositoryImpl
);
```

> 上のコードは方向性を示すためのイメージ。実装時はエラーハンドリング（`res.ok` チェックなど）を必ず入れる。既存の [server/usecases/health.ts](../../containers/apps/frontend-bff/src/server/usecases/health.ts) がバックエンド呼び出しの参考になる。

### Phase 2: ログイン状態を Cookie に持たせる仕組みを作る

「ログイン中かどうか」をブラウザに覚えておいてもらうために、httpOnly Cookie にトークンを保存する。

```ts
// src/lib/session.ts
import 'server-only';

import { cookies } from 'next/headers';

const ACCESS_TOKEN_COOKIE = 'mf_access_token';
const REFRESH_TOKEN_COOKIE = 'mf_refresh_token';

export async function setSessionTokens(accessToken: string, refreshToken: string) {
  const store = await cookies();
  store.set(ACCESS_TOKEN_COOKIE, accessToken, { httpOnly: true, sameSite: 'lax', path: '/' });
  store.set(REFRESH_TOKEN_COOKIE, refreshToken, { httpOnly: true, sameSite: 'lax', path: '/' });
}

export async function clearSessionTokens() {
  const store = await cookies();
  store.delete(ACCESS_TOKEN_COOKIE);
  store.delete(REFRESH_TOKEN_COOKIE);
}

export async function getSessionTokens() {
  const store = await cookies();
  return {
    accessToken: store.get(ACCESS_TOKEN_COOKIE)?.value,
    refreshToken: store.get(REFRESH_TOKEN_COOKIE)?.value,
  };
}
```

> Cookie は Server Action や Route Handler など「サーバー側の処理の中」からしか読み書きできない。Client Component から直接この関数を呼ばないこと（既存ルール「server-only はClientから import しない」を参照）。

### Phase 3: Usecase を作る（サインアップ／ログイン／ログアウト／ログイン判定）

`src/server/usecases/auth.ts` に、画面から使う単位でまとめる。

- `signUpAndStartSession(input)` : サインアップ → 成功したらトークンを Cookie に保存
- `signInAndStartSession(input)` : ログイン → 成功したらトークンを Cookie に保存
- `signOutAndClearSession()` : Cookie のリフレッシュトークンでバックエンドにログアウトを伝える → Cookie を削除
- `getAuthSession()` : 今ログイン中かどうかを調べる（Cookie のアクセストークンを [lib/backend-client.ts](../../containers/apps/frontend-bff/src/lib/backend-client.ts) の `verifyToken()` で検証し、有効なら本人の `userId` などを返す。無効・未ログインなら `null`）

`getAuthSession()` はバックエンドに問い合わせずに済む（`verifyToken()` は公開鍵で署名を検証するだけ）。これを使えば「ログイン中かどうか」を毎回APIを叩かず判定できる。

### Phase 4: Server Actions を作る（フォームからの入口）

`src/server/actions/auth.ts` に、既存の `server/actions/faces.ts` と同じ形で `signUpAction` / `signInAction` / `signOutAction` を作る。中身は Phase 3 の Usecase を呼ぶだけの薄い入口にする。

### Phase 5: 画面を作る

- `app/[locale]/sign-up/page.tsx` + `components/auth/SignUpForm.tsx`
- `app/[locale]/sign-in/page.tsx` + `components/auth/SignInForm.tsx`

フォームの作り方は既存の `components/settings/ProfileEditModal.tsx` と同じく `useState` + `'use client'` の素朴な形に揃える（新しいフォームライブラリは導入しない）。

サインアップ／ログイン成功後は `signInAction` / `signUpAction` の戻り値を見て、ホーム（`/`）へ遷移させる。

### Phase 6: ログイン状態をヘッダーに反映する

`components/ui/AccountMenu.tsx` に「ログアウト」項目を追加する。表示の出し分け（ログイン中 / 未ログイン）は Phase 3 の `getAuthSession()` を呼び出した親（Server Component）から props で渡す。

### Phase 7: i18n（多言語対応）

`ja.json` / `en.json` / `fr.json` に `signUp` / `signIn` の名前空間を追加する（既存の `settings` 等と同じ構成に揃える）。

### Phase 8: Storybook

`components/auth/stories/SignUpForm.stories.tsx` / `SignInForm.stories.tsx` を追加する。

### Phase 9: 検証

```bash
pnpm --filter @tracen/frontend-bff typecheck
pnpm --filter @tracen/frontend-bff lint
pnpm --filter @tracen/frontend-bff build-storybook
```

さらに、実際に開発環境（`pnpm dev` または Dev Container）でサインアップ→ログイン→ログアウトを手動で一通り試す。

## 6. 今回やらないこと（将来の課題）

- フェイス・アクティビティなど、ログインした本人のデータを実際に出し分けること（`user-repository` 等のバックエンド移行が必要）
- パスワードを忘れた場合の再設定
- メールアドレスの確認（本人確認メール）
- アクセストークンが切れた際の自動リフレッシュ（今回は「切れたら再ログインしてもらう」until 別途対応）
- ログインしていないと全ページに入れないようにする、といった全体アクセス制御（下記「確認したい点」参照）

## 7. 確認しておきたい点（実装前にすり合わせたいこと）

- **未ログイン時のアクセス制御について**: 今回はサインアップ／ログイン画面とログアウト導線の追加のみをスコープとし、「ログインしていないとフェイス一覧などの既存ページに入れない」という制御は別Issueとして切り出す想定です。この認識で問題ないか確認したいです（現状はどのページもモックの固定ユーザー前提で誰でも見える状態のため、ここを今回一緒に変えるかどうかで作業量が変わります）。
