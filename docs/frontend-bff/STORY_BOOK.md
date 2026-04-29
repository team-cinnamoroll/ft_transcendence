# Storybook 導入ガイド

## 概要

`containers/apps/frontend-bff` に Storybook を導入済み。  
全コンポーネント（ui・face・home・notifications・search・subscriptions）をカタログとして確認できる。

## 起動方法

```bash
# frontend-bff ディレクトリで実行
pnpm storybook

# またはワークスペースルートから実行
pnpm --filter @tracen/frontend-bff storybook
```

起動後、`http://localhost:6006` でブラウザから確認できる。

## インストール済みパッケージ（devDependencies）

| パッケージ                      | 役割                                 |
| ------------------------------- | ------------------------------------ |
| `storybook`                     | Storybook 本体                       |
| `@storybook/react-vite`         | React + Vite 用フレームワーク        |
| `@storybook/react`              | React レンダラー                     |
| `@storybook/addon-essentials`   | Controls・Actions 等の基本アドオン   |
| `@storybook/addon-interactions` | インタラクションテスト用             |
| `@storybook/blocks`             | ドキュメント自動生成用               |
| `@storybook/test`               | テストユーティリティ                 |
| `vite`                          | ビルドツール（Storybook の動作基盤） |

## ファイル構成

```
containers/apps/frontend-bff/
├── .storybook/
│   ├── main.ts               ← Storybook 設定（@/ エイリアス・モック設定）
│   ├── preview.tsx           ← 全 Story 共通設定（ダークテーマ・DetailPanelProvider）
│   └── mocks/
│       ├── next-image.tsx    ← next/image → <img> に置き換え
│       ├── next-link.tsx     ← next/link → <a> に置き換え
│       ├── next-navigation.ts← usePathname / useRouter 等をダミー実装
│       ├── server-actions.ts ← createFaceAction をダミー実装
│       └── server-only.ts    ← 'server-only' をスタブ化
└── src/components/
    ├── ui/
    │   ├── ActivityCard.tsx
    │   ├── Avatar.tsx
    │   ├── Badge.tsx
    │   ├── BottomNav.tsx
    │   ├── FAB.tsx
    │   ├── FaceChip.tsx
    │   ├── FaceNavItem.tsx
    │   ├── PostModal.tsx
    │   ├── SideNav.tsx
    │   ├── TopBar.tsx
    │   └── stories/
    │       ├── ActivityCard.stories.tsx
    │       ├── Avatar.stories.tsx
    │       ├── Badge.stories.tsx
    │       ├── BottomNav.stories.tsx
    │       ├── FAB.stories.tsx
    │       ├── FaceChip.stories.tsx
    │       ├── FaceNavItem.stories.tsx
    │       ├── PostModal.stories.tsx
    │       ├── SideNav.stories.tsx
    │       └── TopBar.stories.tsx
    ├── face/
    │   └── stories/
    │       ├── CreateFaceModal.stories.tsx
    │       ├── FaceActivityFeed.stories.tsx
    │       └── FaceHeader.stories.tsx
    ├── home/
    │   └── stories/
    │       ├── ActivityFeed.stories.tsx
    │       ├── ActivityTileCalendar.stories.tsx
    │       ├── FaceFilterBar.stories.tsx
    │       └── HomeProfile.stories.tsx
    ├── notifications/
    │   └── stories/
    │       └── NotificationList.stories.tsx
    ├── search/
    │   └── stories/
    │       ├── SearchBar.stories.tsx
    │       ├── SearchResults.stories.tsx
    │       └── SearchScopeSelector.stories.tsx
    └── subscriptions/
        └── stories/
            └── SubscriptionFeed.stories.tsx
```

## Next.js モックについて

このプロジェクトは Next.js 16 を使用しているが、`@storybook/nextjs` は Next.js 15 までしか対応していない。  
そのため `@storybook/react-vite` を採用し、Next.js / サーバー専用モジュールは `.storybook/mocks/` 配下のダミー実装に差し替えている。

| モック対象 | 差し替え内容 |
|---|---|
| `next/image` | 通常の `<img>` タグ |
| `next/link` | 通常の `<a>` タグ |
| `next/navigation` | `usePathname` は常に `'/'`、`useRouter` は no-op |
| `@/server/actions/faces` | `createFaceAction` がダミーの Face を返す |
| `server-only` | 何もしないスタブ（`export {}`） |

## グローバルデコレーターについて

`useDetailPanel()` を内部で使うコンポーネントが多いため、`preview.tsx` で `DetailPanelProvider` をグローバルデコレーターとして登録している。  
全 Story が自動的にこのプロバイダーで囲まれるため、個別の Story 側で設定する必要はない。

## Story ファイルの配置ルール

コンポーネントのディレクトリ直下に `stories/` サブディレクトリを作り、そこに `*.stories.tsx` をまとめる。  
コンポーネント本体と混在せず見通しが保ちやすい。

```
src/components/
├── ui/
│   ├── Avatar.tsx
│   └── stories/              ← 同ディレクトリ内の stories/ に置く
│       └── Avatar.stories.tsx
├── face/
│   ├── FaceHeader.tsx
│   └── stories/
│       └── FaceHeader.stories.tsx
├── home/
│   ├── ActivityFeed.tsx
│   └── stories/
│       └── ActivityFeed.stories.tsx
```

インポートは親ディレクトリへの相対パス（`'../ComponentName'`）を使う。

## Story ファイルの追加方法

新しいコンポーネントをカタログに追加する場合は、対象コンポーネントと同じディレクトリの `stories/` 配下に `*.stories.tsx` ファイルを作成する。

```tsx
// 例: src/components/ui/stories/MyComponent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import MyComponent from '../MyComponent'; // 親ディレクトリからインポート

const meta: Meta<typeof MyComponent> = {
  title: 'UI/MyComponent', // カタログ上の分類名
  component: MyComponent,
  tags: ['autodocs'], // 自動ドキュメント生成を有効化
};

export default meta;
type Story = StoryObj<typeof MyComponent>;

// パターン1
export const Default: Story = {
  args: {
    // コンポーネントに渡す props を書く
  },
};
```

## チーム開発について

`pnpm-lock.yaml` にパッケージが記録されるため、他のメンバーは追加の設定不要。  
以下の手順でブランチを取得すれば Storybook が使える状態になる。

### パターン1：コンテナを起動したまま作業中の場合

```bash
# 1. ブランチを取得
git pull

# 2. コンテナ内で手動で pnpm install を実行
pnpm install

# 3. Storybook を起動
pnpm storybook
```

コンテナ起動時の自動 `pnpm install` はすでに終わっているため、  
`git pull` で `pnpm-lock.yaml` が更新された分を手動で反映する必要がある。

### パターン2：コンテナを停止中（または初めて起動する）場合

```bash
# 1. ブランチを取得
git pull

# 2. コンテナを起動（自動で pnpm install が走る）
# → devcontainer を開き直す、または docker compose up する

# 3. コンテナ起動後に Storybook を起動
pnpm storybook
```

コンテナ起動時に自動で `pnpm install` が実行されるため、手動での実行は不要。
