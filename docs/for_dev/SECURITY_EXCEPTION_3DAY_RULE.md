# 3日ルール例外運用（脆弱性緊急対応）

このドキュメントは、[.npmrc](../../.npmrc) の `minimum-release-age=4320`（3日ルール）により、
通常は新規公開直後のパッケージを導入できない前提で、緊急時の例外手順を定義します。

## 背景

- 通常運用:
  - `ignore-scripts=true`
  - `minimum-release-age=4320`
- 目的:
  - ゼロデイ混入リスク低減
- 副作用:
  - 脆弱性修正版が公開直後の場合、緊急更新できないケースがある

## 例外運用の原則

- 例外は「高/重大脆弱性」かつ「回避不能」の場合のみ
- 期限付き（原則 24h、最長 72h）で実施
- 2名承認（開発責任者 + セキュリティ担当）
- 変更履歴を PR/Issue に必ず記録
- 作業後は `.npmrc` を必ず元に戻す

## 実施フロー

1. 検知

- `pnpm audit` または `pnpm osv:scan-lockfiles` で検知

2. 判定

- CVE/CVSS、悪用可能性、代替策有無を評価

3. 承認

- 2名承認後に例外開始

4. 一時解除して更新

- `.npmrc` を一時変更して導入

5. 復旧

- `.npmrc` を即時原状復帰

6. 再検証

- `pnpm audit` / `pnpm osv:scan-lockfiles` / 必要テスト

7. 共有

- PR/Issue に記録してクローズ

## 一時対応コマンド（変更して戻すまでを一括）

```sh
set -euo pipefail

backup_file=".npmrc.backup.$(date +%Y%m%d%H%M%S)"
cp .npmrc "$backup_file"

restore_npmrc() {
  mv "$backup_file" .npmrc
}
trap restore_npmrc EXIT

# 3日ルールを一時的に緩和（ignore-scripts は維持）
awk '
  /^minimum-release-age=/ { print "minimum-release-age=0"; next }
  { print }
' .npmrc > .npmrc.tmp && mv .npmrc.tmp .npmrc

# 緊急アップデート（例）
pnpm up <package>@<fixed-version>

# lock 更新後の再検証
pnpm audit
pnpm osv:scan-lockfiles
```

## 共有テンプレート（PR/Issue）

- 検知日時:
- 検知手段: (`pnpm audit` / `pnpm osv:scan-lockfiles`)
- 脆弱性ID: (CVE / GHSA)
- 影響範囲:
- 通常運用での対応不可理由: (3日ルールにより未導入)
- 例外実施時間帯:
- 承認者1:
- 承認者2:
- 更新内容:
- 検証結果:
- `.npmrc` 復旧確認: (Yes/No)

## 禁止事項

- `.npmrc` の恒久的な緩和
- 承認なしの例外実施
- 記録なしでの例外終了
