# ESLint 設定ガイド

このドキュメントでは、プロジェクトのESLint設定と使用方法について説明します。

## 概要

このプロジェクトではESLint 9.0の**フラット設定形式**を採用しており、モダンで拡張性の高いコード品質管理を実現しています。

- **ルート設定**: `/eslint.config.js` - 共有ルール
- **Backend設定**: `/containers/apps/backend/eslint.config.js` - Node.js + TypeScript
- **Frontend設定**: `/containers/apps/frontend-bff/eslint.config.js` - React + Next.js + TypeScript

## セットアップ

### 1. 依存関係のインストール

```bash
pnpm install
```

以下のパッケージが各アプリケーションにインストールされます：

**Backend:**

- `eslint` - ESLintコア
- `@eslint/js` - JavaScript推奨設定
- `typescript-eslint` - TypeScript対応

**Frontend:**

- `eslint` - ESLintコア
- `@eslint/js` - JavaScript推奨設定
- `typescript-eslint` - TypeScript対応
- `eslint-plugin-react` - React規則
- `eslint-plugin-react-hooks` - Hooksの規則
- `eslint-plugin-next` - Next.js推奨設定

## 使用方法

### コマンド一覧

| コマンド                                | 説明                                   |
| --------------------------------------- | -------------------------------------- |
| `pnpm lint`                             | すべてのアプリケーションでLintチェック |
| `pnpm lint:fix`                         | すべてのアプリケーションで自動修正     |
| `pnpm -F @tracen/backend lint`          | Backendのみチェック                    |
| `pnpm -F @tracen/backend lint:fix`      | Backendのみ修正                        |
| `pnpm -F @tracen/frontend-bff lint`     | Frontendのみチェック                   |
| `pnpm -F @tracen/frontend-bff lint:fix` | Frontendのみ修正                       |

### 基本的な使用方法

#### Lintチェックの実行

```bash
# 全アプリケーションをチェック
pnpm lint

# 特定のアプリケーションをチェック
pnpm -F @tracen/backend lint
```

出力例：

```
/workspace/containers/apps/backend/src/index.ts
  5:1  warning  Unexpected console statement  no-console

✖ 1 problem (0 errors, 1 warning)
```

#### 自動修正

```bash
# 全アプリケーションを修正
pnpm lint:fix

# 特定のアプリケーションを修正
pnpm -F @tracen/frontend-bff lint:fix
```

## 設定の詳細

### 共通ルール

すべてのアプリケーション共通のルール：

| ルール                               | 設定    | 説明                                        |
| ------------------------------------ | ------- | ------------------------------------------- |
| `no-console`                         | warning | `console.warn()`と`console.error()`のみ許可 |
| `@typescript-eslint/no-unused-vars`  | error   | 未使用変数を禁止（`_`プレフィックスは許可） |
| `@typescript-eslint/no-explicit-any` | warning | `any`型の使用を警告                         |

### Backend固有の設定 (`/containers/apps/backend/eslint.config.js`)

**対応環境:**

- TypeScript + Node.js
- ES2021以降

**無視対象:**

- `dist/`, `build/`, `node_modules/`
- `*.config.js`, `*.config.ts`

### Frontend固有の設定 (`/containers/apps/frontend-bff/eslint.config.js`)

**対応環境:**

- TypeScript + React 19
- Next.js 16

**追加ルール:**
| ルール | 設定 | 説明 |
|--------|------|------|
| `react/react-in-jsx-scope` | off | React 17以降は不要 |
| `react/prop-types` | off | TypeScriptで型定義 |
| `react-hooks/rules-of-hooks` | error | Hooksの正しい使用を強制 |
| `react-hooks/exhaustive-deps` | warn | 依存配列の漏れを警告 |

**無視対象:**

- `dist/`, `build/`, `node_modules/`, `.next/`
- `*.config.js`, `*.config.ts`

#### CommonJS スクリプト (`server-https.cjs`) について

Frontend には `server-https.cjs`（Next.js を HTTPS で起動するための Node.js スクリプト）があり、以下の特徴があります：

- CommonJS（`.cjs`）のため `require()` / `__dirname` / `process` などの Node.js グローバルを使用します
- 一方で、TypeScript ESLint の推奨設定では `require()` が `@typescript-eslint/no-require-imports` によりエラーになります
- また、フラット設定では Node.js グローバルが未定義だと `no-undef` でエラーになります

そのため、`/containers/apps/frontend-bff/eslint.config.js` に **`server-https.cjs` のみ**に効く override を追加しています：

- `files: ["server-https.cjs"]`
- `languageOptions.sourceType: "script"`（CommonJS スクリプト扱い）
- Node.js グローバル（`require`, `process`, `__dirname`, `console` など）を `globals` として定義
- `@typescript-eslint/no-require-imports` を当該ファイルのみ `off`

**注意事項:**

- 同様の Node.js スクリプト（`.cjs`）を増やす場合は、対象ファイルを ESM/TypeScript 化するか、override を「必要なファイルだけ」に限定して追加してください（全体に広げると React/ブラウザ側コードまで緩くなります）。
- `pnpm lint` 実行時に Node の `[MODULE_TYPELESS_PACKAGE_JSON]` 警告が出ることがあります。これは `eslint.config.js` が ESM 構文なのに `package.json` に `type` 指定が無いことが原因で、lint の成否には影響しません（必要なら `package.json` に `"type": "module"` を追加するか、設定ファイル名を ESM として解釈される形式に変更して解消できます）。

## VS Code統合

### ESLint拡張機能のインストール

1. VS Code拡張機能マーケットプレイスで「ESLint」を検索
2. Microsoft公式の「ESLint」拡張をインストール
3. ワークスペースを再度開く

### 設定（`.vscode/settings.json`）

```json
{
  "eslint.enable": true,
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

これでファイル保存時に自動的にESLintの修正が実行されます。

## トラブルシューティング

### ESLintがエラーを表示しない場合

**1. 拡張機能が有効か確認**

```bash
# ターミナルで手動実行
pnpm lint
```

**2. ESLintキャッシュをクリア**

```bash
# キャッシュファイルを削除
rm -rf .eslintcache containers/apps/**/.eslintcache
```

**3. 依存関係の再インストール**

```bash
pnpm install
```

### 特定のルールを無視したい場合

**ファイル全体で無視:**

```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
// コード...
```

**特定の行で無視:**

```typescript
// eslint-disable-next-line no-console
console.log("debug info");
```

**特定のルールのみ無視:**

```typescript
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
const unusedVar = "value";
```

## ベストプラクティス

### 1. 開発時の習慣

- **保存時に自動修正**: VS Code設定で`editor.codeActionsOnSave`を有効化
- **定期的なチェック**: `pnpm lint`をコミット前に実行
- **問題を放置しない**: Warningも改善を心がける

### 2. チーム開発

- **設定共有**: ESLint設定ファイルはリポジトリにコミット
- **統一ルール**: チーム内で規則について合意
- **CI/CD統合**: プルリクエストでLintチェック実行

### 3. ルールのカスタマイズ

プロジェクトのニーズに応じてルールを調整：

```javascript
// eslint.config.js
{
  rules: {
    '@typescript-eslint/no-explicit-any': 'off', // 厳しすぎる場合
    'no-console': ['error'], // 本番環境でconsole禁止
  },
}
```

## 関連リンク

- [ESLint公式ドキュメント](https://eslint.org/docs/)
- [TypeScript ESLint](https://typescript-eslint.io/)
- [ESLint Flat Config](https://eslint.org/docs/latest/use/configure/configuration-files-new)
- [React ESLint Plugin](https://github.com/jsx-eslint/eslint-plugin-react)

## 質問・小話

**Q: なぜフラット設定形式を使用しているのか？**

A: ESLint 9.0から推奨される新形式で、以下の利点があります：

- より簡潔で直感的な設定
- 設定ファイルのコンバージョンが不要
- 将来的なメンテナンスが容易

**Q: 既存のプロジェクトから移行する場合？**

A: ESLintのマイグレーションツールを使用できます：

```bash
npx @eslint/migrate-config .eslintrc.json
```
