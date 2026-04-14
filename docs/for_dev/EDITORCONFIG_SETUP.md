# .editorconfig 設定ガイド

このドキュメントでは、プロジェクトの `.editorconfig` 設定内容と運用方法を説明します。

## 概要

`.editorconfig` は、エディタ間での改行・インデント・文字コードなどの差異をなくし、チーム全体の編集ルールを統一するための設定ファイルです。

このプロジェクトでは、以下を目的として導入しています。

- OS差分（CRLF/LF）による不要な差分を防ぐ
- ファイル末尾改行や末尾空白を統一する
- インデントルール（2スペース）を共通化する
- MarkdownやMakefileの例外ルールを明示する

## 設定ファイル

- ルート設定: `/.editorconfig`
- VS Code設定: `/.vscode/settings.json`（`editor.useEditorConfig: true`）

## 現在の設定内容

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2

[*.md]
trim_trailing_whitespace = false

[Makefile]
indent_style = tab
```

## 各項目の仕様

| 設定 | 値 | 説明 |
|---|---|---|
| `root` | `true` | 上位ディレクトリの `.editorconfig` を探索しない |
| `charset` | `utf-8` | 文字コードを UTF-8 に統一 |
| `end_of_line` | `lf` | 改行コードを LF に統一 |
| `insert_final_newline` | `true` | ファイル末尾に改行を挿入 |
| `trim_trailing_whitespace` | `true` | 行末の不要な空白を自動除去 |
| `indent_style` | `space` | インデントをスペースに統一 |
| `indent_size` | `2` | インデント幅を2に統一 |

### 例外ルール

- `[*.md]`
  - `trim_trailing_whitespace = false`
  - Markdownでは意図的な行末スペース（改行表現）を残せるようにしています。
- `[Makefile]`
  - `indent_style = tab`
  - Makefileはタブ必須のため、スペースではなくタブを使用します。

## VS Code での有効化

このプロジェクトでは、`.vscode/settings.json` で `editor.useEditorConfig` を有効化済みです。

```json
{
  "editor.useEditorConfig": true
}
```

通常はこれだけで、保存時に `.editorconfig` のルールが適用されます。

## 動作確認

1. TypeScript ファイルでインデントをタブにして保存
2. 2スペースに補正されることを確認
3. Markdown ファイルで行末スペースを入れて保存
4. 行末スペースが維持されることを確認

## 運用ルール

- 基本方針
  - 編集系の共通ルールは `.editorconfig` に集約する
  - フォーマットスタイルは Prettier、品質ルールは ESLint で管理する
- 変更時
  - `.editorconfig` を変更した場合は、このドキュメントも更新する
  - 変更理由（例: 言語仕様・CI要件）をPRに明記する

## 関連ドキュメント

- `docs_for_dev/LINTER_SETUP.md`
- `docs_for_dev/PRETTIER_SETUP.md`
- `.vscode/settings.json`
- `.editorconfig`
