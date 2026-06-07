# MultiFace → tracen フロントエンド移植計画書

> 作成日: 2026-06-05
> 対象: `/Users/kharuya/github/MultiFace` → `containers/apps/frontend-bff/`

---

## 概要

MultiFace プロジェクトで新たに設計・実装されたフロントエンドを tracen 本体（frontend-bff）に移植する。
tracen 側には以下の制約（アーキテクチャ要求）があるため、コードを単純コピーするのではなく、各要求に適合させながら移植する。

### tracen 側のアーキテクチャ要求（変えてはいけないもの）

| 要求                         | 詳細                                                                                                                                         |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **i18n（next-intl）**        | `app/[locale]/` ルーティング。UI文字列は `useTranslations` / `getTranslations` 経由。翻訳ファイルは `ja.json` / `en.json` / `fr.json` に追記 |
| **Storybook**                | `components/**/{コンポーネント名}.stories.tsx` 形式でストーリーを追加                                                                        |
| **レイヤードアーキテクチャ** | UI → Usecase → Repository → Mock/API の厳格な分離。Client Component から `server-only` を直接 import 禁止                                    |
| **命名規則**                 | 契約: `XxxSpec`、実装: `XxxImpl`、DI入口: `getXxx()`                                                                                         |
| **Async デフォルト**         | Repository の全メソッドは `Promise<T>` を返す                                                                                                |
| **Zod 環境変数**             | 環境変数は `lib/env/server.ts` / `lib/env/public.ts` で Zod 検証                                                                             |
| **Docker standalone**        | `next.config.ts` の `output: 'standalone'` を維持                                                                                            |

---

## 差分サマリー

### MultiFace で追加された新規コンポーネント（tracen に存在しない）

| コンポーネント         | カテゴリ | 概要                                                 |
| ---------------------- | -------- | ---------------------------------------------------- |
| `AppHeader.tsx`        | ui/      | ヘッダー（tracen の `TopBar.tsx` を置き換え候補）    |
| `ContextRail.tsx`      | ui/      | 右サイドバー（コンテキスト情報表示）                 |
| `SeedCard.tsx`         | ui/      | アクティビティカード（フィード用独立コンポーネント） |
| `FaceBadge.tsx`        | ui/      | フェイスバッジ                                       |
| `SeedRow.tsx`          | ui/      | シード行コンポーネント                               |
| `DateBar.tsx`          | ui/      | 日付バー                                             |
| `RailCard.tsx`         | ui/      | レールカード                                         |
| `MobileComposeBar.tsx` | ui/      | モバイル用作成バー                                   |
| `Wordmark.tsx`         | ui/      | ロゴ                                                 |
| `AccountMenu.tsx`      | ui/      | アカウントメニュー                                   |
| `FaceDetailClient.tsx` | face/    | フェイス詳細クライアント（新規）                     |
| `SeedDetailPage.tsx`   | seed/    | シード詳細（新カテゴリ）                             |

### MultiFace で更新された既存コンポーネント（tracen にも存在する）

- `SideNav.tsx`, `BottomNav.tsx`, `DetailPanel.tsx`, `PostModal.tsx`
- `FaceDetail.tsx`, `SeedDetail.tsx`, `FaceChip.tsx`, `FaceNavItem.tsx`
- `Avatar.tsx`, `Badge.tsx`
- home/: `HomeClient.tsx`, `HomeProfile.tsx`, `SeedFeed.tsx`, `FaceFilterBar.tsx`, `SeedTileCalendar.tsx`
- face/: `FacesClient.tsx`, `FaceHeader.tsx`, `FaceSeedFeed.tsx`, `CreateFaceModal.tsx`
- search/: `SearchClient.tsx`, `SearchBar.tsx`, `SearchResults.tsx`, `SearchScopeSelector.tsx`
- subscriptions/: `SubscriptionFeed.tsx`
- notifications/: `NotificationList.tsx`

### 新規ページ

| MultiFace のパス              | tracen 移植先                          |
| ----------------------------- | -------------------------------------- |
| `app/seeds/[seedId]/page.tsx` | `app/[locale]/seeds/[seedId]/page.tsx` |

### 新規デザインシステム

MultiFace で「Midnight Ink」デザインシステムが導入された。CSS Custom Properties（`--mf-*`）と日本語フォント設定が新規追加。

### 新規ユーティリティ・型

| MultiFace                            | tracen 対応                                                                       |
| ------------------------------------ | --------------------------------------------------------------------------------- |
| `lib/display.ts` の `getFaceColor()` | tracen の `lib/display.ts` に追記                                                 |
| `types/user.ts`（`User` 型）         | **`@tracen/contracts` の `UserProfile` を正として使用**（下記「型管理方針」参照） |
| `lib/format-relative-time.ts`        | 差分があれば更新                                                                  |

### 型管理方針（重要）

tracen では「バックエンドと共有すべき型は `@tracen/contracts/` に置く」という取り決めがある。  
現時点で contracts に移行済みなのは `UserProfile`（旧: フロントエンドの `User` 型）のみ。

**移植時のルール:**

| MultiFace の型     | tracen での配置                                               | 理由                                     |
| ------------------ | ------------------------------------------------------------- | ---------------------------------------- |
| `User`             | **使わない**。`@tracen/contracts` の `UserProfile` を参照する | contracts への移行済み型。重複定義しない |
| `Face`             | `src/types/face.ts`（既存）                                   | バックエンド共有未定。types に置く       |
| `Seed`             | `src/types/seed.ts`（既存）                                   | 同上                                     |
| `Notification`     | `src/types/notification.ts`（既存）                           | 同上                                     |
| `DetailPanelState` | `src/types/detail-panel.ts`（既存）                           | フロントエンド固有。types に置く         |
| `Seed`（新規）     | `src/types/seed.ts`（新規追加）                               | バックエンド共有未定。types に置く       |

> **契約:** 将来バックエンドとの型共有が必要になった型は contracts に移動する。  
> ただし今回の移植では `UserProfile` 以外を contracts に追加しない。

**MultiFace のコンポーネントが `User` 型を参照している箇所は、移植時にすべて `UserProfile` 型に置き換える。**  
フィールド差異が生じる場合は tracen の `UserProfile` を正として、コンポーネント側を合わせる。

---

## 移植フェーズ

### Phase 0: ブランチ準備

```
git checkout -b feat/frontend-ui-pages
```

---

### Phase 1: デザインシステム更新

**対象ファイル:** `src/app/globals.css`

**作業内容:**

- MultiFace の `globals.css` から `--mf-*` CSS Custom Properties を tracen の `globals.css` に統合
- 日本語フォント設定（Noto Sans JP, Shippori Mincho B1）を追加
- tracen 既存のダークモード設定・スクロールバースタイルを維持したまま統合
- フェイスカラー 6色（`--mf-face-water` 〜 `--mf-face-grass`）を追加

**注意:** tracen 既存のカラー変数との競合チェックを行い、必要に応じて名前空間（`--mf-` プレフィックス）で区別する。

---

### Phase 2: ユーティリティ・型の更新

**対象ファイル:**

- `src/lib/display.ts` — `getFaceColor()` 追加
- `src/lib/format-relative-time.ts` — 差分確認・更新
- `src/types/` — `User` 型と `UserProfile` 型の整合性確認

**作業内容:**

#### `getFaceColor()` の追加

MultiFace の `lib/display.ts` にある以下のロジックを tracen の同ファイルに追記:

```ts
const MF_FACE_COLORS = [
  'var(--mf-face-water)',
  'var(--mf-face-moss)',
  'var(--mf-face-wisteria)',
  'var(--mf-face-persimmon)',
  'var(--mf-face-rose)',
  'var(--mf-face-grass)',
];

export const getFaceColor = (faceId: string): string => {
  const digits = faceId.replace(/\D/g, '');
  const sum = digits.split('').reduce((acc, d) => acc + parseInt(d, 10), 0);
  return MF_FACE_COLORS[sum % 6];
};
```

#### User 型 → UserProfile への統一

MultiFace の `types/user.ts`（`User` 型）は tracen に持ち込まない。  
代わりに `@tracen/contracts` が export する `UserProfile` 型を使う。

移植するコンポーネントが `User` を参照している箇所はすべて `UserProfile` に置き換える。  
フィールドに差異がある場合は `UserProfile` を正として、コンポーネント側の参照を修正する（contracts 側は変更しない）。

```ts
// NG: MultiFace の User 型をそのまま持ち込む
import type { User } from '@/types/user';

// OK: contracts の UserProfile を使う
import type { UserProfile } from '@tracen/contracts';
```

新規追加が必要な型（`Seed` 等）は `src/types/` に追加する。contracts には追加しない。

---

### Phase 3: 新規 UI コンポーネントの追加

各コンポーネントについて以下の手順で移植する:

1. MultiFace のコンポーネントをコピー
2. **ハードコードされた日本語文字列を `useTranslations` / `getTranslations` に置き換え**
3. 翻訳キーを `src/i18n/messages/ja.json`, `en.json`, `fr.json` に追加
4. `User` 型を `UserProfile` 型に合わせて修正
5. `import "server-only"` が必要な場所に追記（Client Component は不要）
6. Storybook ストーリーを `stories/` 配下に追加

**追加順序（依存関係の少ないものから）:**

```
1. Wordmark.tsx           — ロゴ（依存なし）
2. DateBar.tsx            — 日付バー（依存なし）
3. RailCard.tsx           — レールカード（依存なし）
4. FaceBadge.tsx          — フェイスバッジ（getFaceColor 依存）
5. MobileComposeBar.tsx   — モバイル作成バー（PostModal 依存）
6. AccountMenu.tsx        — アカウントメニュー（Avatar 依存）
7. SeedCard.tsx       — アクティビティカード（FaceChip 等依存）
8. SeedRow.tsx            — シード行（型定義要確認）
9. AppHeader.tsx          — ヘッダー（Wordmark, AccountMenu 依存）
10. ContextRail.tsx       — 右サイドバー（RailCard 等依存）
```

**Storybook 追加時の注意:**

- `"use client"` コンポーネントには `withDetailPanel` / `withNextIntl` デコレーターが自動適用される（`.storybook/preview.tsx` 参照）
- Server Actions を使うコンポーネントは `.storybook/main.ts` の `viteFinal.resolve.alias` でモック化が必要

---

### Phase 4: 既存コンポーネントの更新

MultiFace で変更された既存コンポーネントを差分比較し、tracen 側に取り込む。

**手順:**

1. MultiFace の最新版と tracen 現行版の diff を取る
2. i18n・型・レイヤー制約を守りながら差分を適用
3. 既存 Storybook ストーリーを更新

**優先順位（ページへの影響度順）:**

```
高 (レイアウト・全ページ影響):
  - SideNav.tsx, BottomNav.tsx, DetailPanel.tsx

中 (各ページのメインコンポーネント):
  - home/: HomeClient, HomeProfile, SeedFeed, FaceFilterBar, SeedTileCalendar
  - face/: FacesClient, FaceHeader, FaceSeedFeed, CreateFaceModal, FaceDetailClient
  - search/: SearchClient, SearchBar, SearchResults, SearchScopeSelector
  - subscriptions/: SubscriptionFeed
  - notifications/: NotificationList

低 (汎用 UI 部品):
  - Avatar, Badge, FaceChip, FaceNavItem
  - PostModal, FaceDetail, SeedDetail
```

---

### Phase 5: 新規ページの追加（seeds）

**作業内容:**

1. **型定義追加:** `src/types/seed.ts`
2. **モックデータ追加:** `src/mocks/seeds.ts`
3. **Repository 追加:** `src/repositories/seed-repository.ts`
   - `SeedRepositorySpec` を定義（全メソッド `Promise<T>`）
   - `createSeedMockRepositoryImpl()` を実装
   - `getSeedRepository()` を Provider として公開
4. **Usecase 追加:** `src/server/usecases/seeds.ts`
5. **ページ追加:** `src/app/[locale]/seeds/[seedId]/page.tsx`
6. **コンポーネント追加:** `src/components/seed/SeedDetailPage.tsx`
7. **i18n 追加:** `seeds` 名前空間のキーを各翻訳ファイルに追加
8. **Storybook 追加:** `src/components/seed/stories/SeedDetailPage.stories.tsx`

**Route Handler が必要な場合:**

- `src/app/api/detail/seed/[seedId]/route.ts` を追加（Client Component から fetch する場合）

---

### Phase 6: レイアウト更新

**対象ファイル:** `src/app/[locale]/layout.tsx`

**作業内容:**

- `AppHeader.tsx` が `TopBar.tsx` を置き換える場合、layout.tsx の import を変更
- `ContextRail.tsx` の配置箇所を確認・追加
- i18n の `getTranslations` 呼び出しが必要な場合は対応

---

### Phase 7: i18n 翻訳キーの整理

全フェーズで追加した翻訳キーを以下 3 ファイルに統一:

```
src/i18n/messages/ja.json  — 日本語（主）
src/i18n/messages/en.json  — 英語（翻訳）
src/i18n/messages/fr.json  — フランス語（翻訳）
```

**追加が想定される名前空間:**

```json
{
  "appHeader": { ... },
  "contextRail": { ... },
  "accountMenu": { ... },
  "seedCard": { ... },
  "seeds": { ... },
  "seedDetail": { ... }
}
```

---

### Phase 8: 検証

各フェーズ完了後に以下を実行:

```bash
# 型チェック
pnpm --filter @tracen/frontend-bff typecheck

# Lint
pnpm --filter @tracen/frontend-bff lint

# Storybook ビルド確認
pnpm --filter @tracen/frontend-bff build-storybook
```

---

## 移植時の共通チェックリスト

各コンポーネント移植時に確認する事項:

- [ ] ハードコード日本語 → `useTranslations` / `getTranslations` に置き換えた
- [ ] 翻訳キーを ja.json / en.json / fr.json に追加した
- [ ] `User` 型 → tracen の `UserProfile` 型に合わせた
- [ ] `import "server-only"` が必要な場所に入っているか確認した
- [ ] Client Component から `repositories/` または `server/usecases/` を直接 import していない
- [ ] Storybook ストーリーを追加した
- [ ] ストーリーで next-intl / DetailPanel のデコレーターが必要な場合に対応した
- [ ] `pnpm --filter @tracen/frontend-bff typecheck` がパスする

---

## 移植しないもの（除外リスト）

| MultiFace の要素                  | 理由                                                  |
| --------------------------------- | ----------------------------------------------------- |
| `next.config.ts` の `output` 設定 | tracen は `standalone` を維持。MultiFace には設定なし |
| `next-intl` プラグイン設定        | tracen 側に既に設定済み。MultiFace には i18n なし     |
| Storybook モック設定              | tracen 側の `.storybook/` を維持・拡張。上書きしない  |
| `src/i18n/routing.ts`             | tracen の既存ロケール設定（ja/en/fr）を維持           |
| Docker 関連ファイル               | tracen 側の Dockerfile / docker-compose を維持        |
