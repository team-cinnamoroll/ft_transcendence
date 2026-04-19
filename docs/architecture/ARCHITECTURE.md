# プロジェクト全体アーキテクチャ

## 技術スタック

| レイヤー             | 技術                              |
| -------------------- | --------------------------------- |
| フロントエンド / BFF | Next.js（React 19）, Tailwind CSS |
| バックエンド API     | Hono（Node.js）                   |
| 型共有               | pnpm workspaces（モノレポ）       |
| リバースプロキシ     | Nginx                             |
| データベース         | PostgreSQL                        |
| パッケージ管理       | pnpm                              |
| テスト               | Vitest                            |

## リポジトリ構成

```
tracen/
├── .devcontainer/                     # Dev Container 設定（VSCode Remote / GitHub Codespaces）
├── .vscode/                           # VSCode ワークスペース設定
├── apps/                              # 各アプリへのシンボリックリンク等（参照用）
├── containers/                        # Docker コンテナ関連の実体
│   ├── apps/
│   │   ├── backend/                   # Hono バックエンド API
│   │   │   └── src/
│   │   │       ├── index.ts           # エントリーポイント・ルーティング定義
│   │   │       └── env.ts             # 環境変数バリデーション（Zod）
│   │   └── frontend-bff/              # Next.js フロントエンド + BFF
│   │       └── src/
│   │           ├── app/               # Next.js App Router（ページ・API Route）
│   │           │   ├── page.tsx       # ホーム
│   │           │   ├── faces/         # フェイス一覧・詳細
│   │           │   ├── search/        # 検索
│   │           │   ├── notifications/ # 通知
│   │           │   ├── subscriptions/ # サブスクリプション
│   │           │   └── api/           # BFF API Route Handler
│   │           ├── components/        # UI コンポーネント
│   │           ├── repositories/      # データ取得ロジック
│   │           ├── types/             # 型定義
│   │           ├── lib/               # ユーティリティ・クライアント
│   │           └── mocks/             # モックデータ
│   └── infra/
│       ├── db/
│       │   └── init.sql               # DB 初期化（PostgreSQL）
│       └── nginx/
│           └── nginx.conf             # リバースプロキシ設定
├── docs/                              # 設計・運用ドキュメント
├── infra/                             # インフラ設定（クラウド等）
├── scripts/                           # 開発補助スクリプト
│   ├── deploy-local-prod.sh           # ローカル本番環境デプロイ
│   ├── down-local-prod.sh             # ローカル本番環境停止
│   └── setup-local-prod-tls.sh        # TLS 証明書セットアップ
├── .editorconfig                      # エディタ設定（インデント・改行コード統一）
├── .env.dev                           # 開発環境 環境変数（git 管理外）
├── .env.dev.example                   # 開発環境 環境変数サンプル
├── .env.local-prod                    # ローカル本番環境 環境変数（git 管理外）
├── .env.local-prod.example            # ローカル本番環境 環境変数サンプル
├── .gitignore
├── .npmrc                             # pnpm 設定
├── .prettierrc.json                   # Prettier 設定
├── docker-compose.dev.yml             # 開発環境 Docker Compose
├── docker-compose.local-prod.yml      # ローカル本番相当環境 Docker Compose
├── eslint.config.js                   # ESLint 設定（ルート共通）
├── package.json                       # ルートパッケージ（ワークスペース共通スクリプト）
├── pnpm-lock.yaml
├── pnpm-workspace.yaml                # pnpm workspaces 定義
└── README.md
```

## アーキテクチャ概念図

```
ブラウザ
  │  HTTP
  ▼
┌────────────────────────────┐
│           Nginx            │  ← リバースプロキシ
│  / および /api/ → frontend  │
└────────────┬───────────────┘
             │
             ▼
┌────────────────────────────────────┐
│     frontend-bff（Next.js）         │
│                                    │
│  [React コンポーネント / ページ]    │  ← UI レイヤー
│              ↓                     │
│  [App Router API Route Handler]    │  ← BFF レイヤー
│    /api/* でブラウザからの          │
│    リクエストを受け付ける            │
└────────────┬───────────────────────┘
             │ HTTP（Hono RPC / hc クライアント）
             │ ※ server-only: ブラウザからは直接届かない
             ▼
┌────────────────────────────┐
│     backend（Hono）         │  ← API サーバー
│  - ビジネスロジック          │
│  - DB アクセス               │
└────────────┬───────────────┘
             │
             ▼
      PostgreSQL（tracen DB）
```

## 各レイヤーの責務

### Nginx

- 全リクエストの入口（ポート 80 / 443）
- `/` および `/api/` をすべて `frontend-bff` にプロキシ
- リゾルバを利用した動的名前解決（コンテナ再起動時の 502 を防止）

### frontend-bff（Next.js）

- **UI レイヤー**：React コンポーネントでユーザーインターフェースを提供
- **BFF レイヤー**：`app/api/` の Route Handler がブラウザからのリクエストを受け付け、バックエンドへ転送する
- バックエンドとの通信には **Hono RPC**（`hono/client` の `hc` 関数）を使用し、型安全なクライアントを生成
- バックエンドへの通信は `server-only` つき関数で行い、**バックエンド URL はブラウザに公開されない**

### backend（Hono）

- RESTful API サーバー（Hono フレームワーク）
- `AppType` をエクスポートして frontend-bff との型共有を実現（モノレポ構成を活かした型安全 RPC）
- 環境変数は Zod でバリデーション
- HTTPS 対応（TLS 証明書パスを環境変数で設定可能）

### PostgreSQL

- DB 名：`tracen`
- 初期化スクリプト：`containers/infra/db/init.sql`

## モノレポ・型共有の仕組み

```
packages:
  - containers/apps/backend      (@tracen/backend)
  - containers/apps/frontend-bff (@tracen/frontend-bff)
```

`frontend-bff` の `package.json` で `@tracen/backend` を `workspace:*` で参照することで、**バックエンドの `AppType`（ルート型）を直接インポート**できます。これにより Hono RPC による型安全な API 呼び出しが実現されています。

```typescript
// frontend-bff/src/lib/backend-client.ts
import { hc } from 'hono/client';
import type { AppType } from '@tracen/backend';

const client = hc<AppType>(APP_API_BASE_URL);
// → 型補完が効いた状態でバックエンドを呼べる
```

## 環境構成

| 環境             | 構成ファイル                    | 用途                                 |
| ---------------- | ------------------------------- | ------------------------------------ |
| 開発             | `docker-compose.dev.yml`        | 通常の開発作業（ホットリロードあり） |
| ローカル本番相当 | `docker-compose.local-prod.yml` | 本番に近い動作確認（TLS あり）       |

詳細: [docs/deploy/LOCAL_PROD_DEPLOYMENT.md](../deploy/LOCAL_PROD_DEPLOYMENT.md)

## 開発ルール・ツール

| ツール       | 設定ファイル                 | ドキュメント                                               |
| ------------ | ---------------------------- | ---------------------------------------------------------- |
| ESLint       | `eslint.config.js`           | [LINTER_SETUP.md](../for_dev/LINTER_SETUP.md)              |
| Prettier     | `.prettierrc.json`           | [PRETTIER_SETUP.md](../for_dev/PRETTIER_SETUP.md)          |
| EditorConfig | `.editorconfig`              | [EDITORCONFIG_SETUP.md](../for_dev/EDITORCONFIG_SETUP.md)  |
| Vitest       | 各 app 内 `vitest.config.ts` | [VITEST_BACKEND_SETUP.md](../test/VITEST_BACKEND_SETUP.md) |

## 関連ドキュメント

- [BFF API ガイド](../api/BFF_API_GUIDE.md)
- [ローカル本番環境デプロイ](../deploy/LOCAL_PROD_DEPLOYMENT.md)
