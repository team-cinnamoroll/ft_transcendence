# Prettier フォーマッター設定ガイド

このドキュメントでは、プロジェクトのPrettier設定と使用方法について説明します。

## 概要

Prettierはコードフォーマッターで、ESLintと組み合わせることでコード品質と一貫性を維持します。

- **ルート設定**: `/prettier.json` - 統一フォーマット規則
- **無視設定**: `/.prettierignore` - フォーマット対象外ファイル
- **VS Code統合**: 保存時に自動フォーマット

## セットアップ

### 1. 依存関係のインストール

```bash
pnpm install
```

以下のパッケージが各アプリケーションにインストールされます：

**全アプリケーション:**
- `prettier` - Prettierコア

### 2. 拡張機能のインストール

VS CodeにPrettier拡張がまだインストールされていない場合：

1. VS Code拡張機能マーケットプレイスで「Prettier」を検索
2. 「Prettier - Code formatter」（Prettier公式）をインストール

## 使用方法

### コマンド一覧

| コマンド | 説明 |
|---------|------|
| `pnpm format` | すべてのアプリケーションをフォーマット |
| `pnpm format:check` | フォーマット状況をチェック（修正なし） |
| `pnpm -F @tracen/backend format` | Backendのみフォーマット |
| `pnpm -F @tracen/frontend-bff format` | Frontendのみフォーマット |

### 基本的な使用方法

#### 自動フォーマット（推奨）

VS Code設定で自動フォーマットが有効化されています。ファイルを保存するだけで自動修正されます：

1. ファイルを編集
2. `Ctrl+S`（Windows/Linux）または `Cmd+S`（Mac）で保存
3. ESLint修正 → Prettier フォーマットが自動実行

```typescript
// 保存前
const x=1;const y=2;
function hello( ){console.log("hello")}

// 保存後（自動フォーマット）
const x = 1;
const y = 2;
function hello() {
  console.log('hello');
}
```

#### 手動実行

```bash
# 全アプリケーションをフォーマット
pnpm format

# 特定のアプリケーションのみ
pnpm -F @tracen/backend format
```

#### フォーマット状況の確認

修正なしで現在の状態を確認：

```bash
pnpm format:check
```

出力例：
```
✔ All matched files are already formatted
```

## 設定の詳細

### `.prettierrc.json` - フォーマット規則

| 設定 | 値 | 説明 |
|-----|-----|------|
| `semi` | `true` | ステートメント末尾にセミコロンを追加 |
| `trailingComma` | `es5` | 末尾のコンマはES5互換（オブジェクト・配列のみ） |
| `singleQuote` | `true` | シングルクォートを使用 |
| `printWidth` | `100` | 1行の最大文字数 |
| `tabWidth` | `2` | インデント幅 2スペース |
| `useTabs` | `false` | スペースでインデント（タブ不使用） |
| `arrowParens` | `always` | アロー関数も常に括弧付け |
| `endOfLine` | `lf` | 行末を LF で統一 |

### `.prettierignore` - 無視対象

以下のファイル・フォルダはフォーマット対象外：

- `node_modules/`, `dist/`, `build/`, `.next/`
- ロックファイル（`pnpm-lock.yaml`, `package-lock.json`）
- 設定ファイル（`tsconfig.json`, `eslint.config.js`, `next.config.ts`）
- Dockerファイル、ログファイル

## ESLintとの連携

### 実行順序

保存時に以下の順序で実行されます：

```
ファイル保存
    ↓
1. ESLint: コード解析・修正
    ↓
2. Prettier: フォーマット
    ↓
完了
```

この順序により、ESLintがコード品質を、Prettierがスタイルを担当します。

### ルールの競合を避ける

ESLintとPrettierが相互干渉しないよう調整済みです。各自のルールセットを確認する場合：

```bash
# ESLintチェック
pnpm lint

# フォーマット確認
pnpm format:check
```

## VS Code統合

### 設定ファイル: `.vscode/settings.json`

```json
{
  "prettier.enable": true,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode", 
    "editor.formatOnSave": true
  }
}
```

### 手動フォーマット

保存以外の方法でフォーマット：

1. **コマンドパレット**: `Ctrl+Shift+P` → 「Format Document」
2. **右クリック**: 「Format Document」を選択
3. **ショートカット**: キーバインディング設定でカスタマイズ可能

## トラブルシューティング

### Prettier がファイルを修正しない場合

**1. 拡張機能が有効か確認**
```bash
# ターミナルで手動実行
pnpm format
```

**2. Prettier 設定を確認**
```bash
# .prettierrc.json が存在確認
ls -la .prettierrc.json
```

**3. キャッシュクリア**
```bash
# node_modules を再インストール
rm -rf node_modules .pnpm-store
pnpm install
```

### 特定のファイルを無視したい場合

**方法 1: `.prettierignore` に追加**
```
docs/old_code.js
vendor/
```

**ファイル全体で無視:**
```javascript
// prettier-ignore
const weirdCode = { x : 1 }
```

**特定の行を無視:**
```javascript
// prettier-ignore
const x = 1;   const y = 2;

const properly = 'formatted';
```

### ESLint と Prettier が競合している場合

以下の組み合わせでESLintルールを調整：

```javascript
// eslint.config.js
{
  rules: {
    // Prettierに任せるルール
    'indent': 'off',
    'quotes': 'off',
    'semi': 'off',
  },
}
```

## ベストプラクティス

### 1. 開発時の習慣

- **保存時自動修正**: VS Code設定で自動化
- **定期的なフォーマット確認**: `pnpm format:check`
- **新規ファイル**: 作成後すぐに保存しフォーマット

### 2. チーム開発

- **設定ファイルをコミット**: `.prettierrc.json` はリポジトリに含める
- **ルール統一**: チーム全体で同じ設定を使用
- **CI/CD統合**: プルリクエストでフォーマット確認

### 3. 設定のカスタマイズ

プロジェクト特有のニーズがある場合、`.prettierrc.json` を編集：

```json
{
  "printWidth": 120,        // 長い行に対応
  "singleQuote": false,     // ダブルクォート使用
  "trailingComma": "none"   // 末尾カンマなし
}
```

変更後は必ず再フォーマット：
```bash
pnpm format
```

## ESLint との関係

### 組み合わせによるメリット

| ツール | 役割 |
|--------|------|
| **ESLint** | コード品質チェック（ルール違反検出） |
| **Prettier** | コード整形（スタイル統一） |

例：
```typescript
// ESLintが検出: 未使用変数
const unusedVar = 5;  // ← ESLint error

// Prettierが修正: スタイル不一致
const x=1; const y=2;  // ← Prettier formats to proper spacing
```

## 関連リンク

- [Prettier 公式ドキュメント](https://prettier.io/docs/)
- [Prettier VS Code](https://github.com/prettier/prettier-vscode)
- [ESLint + Prettier の統合](https://prettier.io/docs/en/integrating-with-linters.html)
- [.prettierrc.json オプション](https://prettier.io/docs/en/options.html)

## よくある質問

**Q: Prettier が ESLint と競合するのでは？**

A: 互いに担当領域が異なるため、競合しません。
- ESLint: 潜在的なバグやコーディング習慣の検出
- Prettier: コードスタイルの統一

**Q: すべてのファイルはフォーマットされる？**

A: いいえ。`.prettierignore` で除外設定しています。必要に応じて追加可能です。

**Q: 古いコードをフォーマットしたくない**

A: 段階的にフォーマットすることを推奨します：
```bash
# 特定フォルダのみフォーマット
cd apps/backend && pnpm format
```

## まとめ

| 操作 | コマンド |
|------|---------|
| 全体フォーマット | `pnpm format` |
| フォーマット確認 | `pnpm format:check` |
| 自動修正 | ファイル保存時に自動実行 |
