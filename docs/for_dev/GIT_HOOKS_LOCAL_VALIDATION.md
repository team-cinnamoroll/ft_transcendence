# Git Hooks とローカル検証ガイド

このドキュメントでは、Husky と lint-staged による Git hooks の運用と、pnpm scripts で実行できるローカル検証コマンドを説明します。

## 概要

このリポジトリでは、コミット前と push 前に次の自動チェックを行います。

- pre-commit: staged ファイル対象の lint/format に加えて、依存脆弱性チェック、secret スキャン、ロックファイルのみの OSV スキャンを実行
- pre-push: ワークスペース全体の typecheck と local-ci:fast を実行

設定ファイル:

- [package.json](../../package.json)
- [.husky/pre-commit](../../.husky/pre-commit)
- [.husky/pre-push](../../.husky/pre-push)

## Git hooks の動作

### pre-commit

定義: [.husky/pre-commit](../../.husky/pre-commit#L1)

自動実行コマンド:

```sh
pnpm exec lint-staged
pnpm audit
pnpm secrets:scan
pnpm osv:scan-lockfiles
```

lint-staged 設定（[package.json](../../package.json#L33)）:

- JavaScript / TypeScript 系ファイル:
  - eslint --fix
  - prettier --write
- JSON / Markdown / CSS / YAML 系ファイル:
  - prettier --write

ポイント:

- 対象は staged ファイルのみ
- 自動修正可能な問題はコミット前に修正される
- `pnpm audit` で依存脆弱性が見つかるとコミットは停止する
- `pnpm secrets:scan`（gitleaks-secret-scanner）で secret の疑いがあるとコミットは停止する
- `pnpm osv:scan-lockfiles` で `pnpm-lock.yaml` の脆弱性が見つかるとコミットは停止する
- 修正できないエラーが残る場合、コミットは失敗する

### pre-push

定義: [.husky/pre-push](../../.husky/pre-push#L1)

自動実行コマンド:

```sh
pnpm typecheck && pnpm local-ci:fast
```

ポイント:

- typecheck が失敗した時点で push は停止
- typecheck が通った場合のみ local-ci:fast を実行
- local-ci:fast が失敗した場合も push は停止

## pnpm prepare でできること

定義: [package.json](../../package.json#L8)

```json
"prepare": "husky"
```

`pnpm install` 実行時に `prepare` が走り、Husky が Git hooks を有効化します。

具体的には:

- `.husky/` ディレクトリを hooks の実行元として利用できる状態にする
- `pre-commit` / `pre-push` などのフックを Git が参照できるようにする

注意:

- hooks はローカル Git 環境で実行される
- `git push --no-verify` でローカルフックはスキップ可能
- チーム全体で厳密に強制するには、CI 側でも必須チェック化が必要

## 手動で実行できるローカル検証コマンド一覧（pnpm scripts）

対象定義: [package.json](../../package.json#L4)

| コマンド                  | 実行内容                                              | 主な用途                          |
| ------------------------- | ----------------------------------------------------- | --------------------------------- |
| `pnpm typecheck`          | `pnpm -r typecheck`（ワークスペース全体の型チェック） | push 前の型整合性確認             |
| `pnpm lint`               | `pnpm -r lint`（ワークスペース全体の lint チェック）  | ルール違反検出                    |
| `pnpm lint:fix`           | `pnpm -r lint:fix`（ワークスペース全体の自動修正）    | lint 自動修正                     |
| `pnpm secrets:scan`       | `gitleaks-secret-scanner --diff-mode staged`          | staged 変更の secret スキャン     |
| `pnpm osv:scan-lockfiles` | `osv-scanner scan -L pnpm-lock.yaml`                  | ロックファイルのみの OSV スキャン |
| `pnpm format`             | `pnpm -r format`（ワークスペース全体の整形）          | フォーマット統一                  |
| `pnpm format:check`       | `prettier --check .`（ルート配下の整形確認）          | 整形差分の検出                    |
| `pnpm local-ci:fast`      | `bash scripts/local-ci-local-prod.sh fast`            | 高頻度の統合スモーク確認          |
| `pnpm local-ci:full`      | `bash scripts/local-ci-local-prod.sh full`            | レジストリ込みの高忠実度確認      |

### 追加された手動実行スクリプト

pnpm scripts の裏側で使っている、単体でも実行できるスクリプトです。

| スクリプト                                     | 実行内容                                                                                                     | 用途                                                          |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| `.devcontainer/scripts/install-osv-scanner.sh` | GitHub Releases から OSV-Scanner バイナリを取得し、SHA256 を検証して `/usr/local/bin/osv-scanner` に配置する | Dev Container 初回作成時の導入、または再インストール          |
| `scripts/osv-scan-lockfiles.sh`                | `osv-scanner scan -L pnpm-lock.yaml` を実行する                                                              | `pnpm osv:scan-lockfiles` の実体、lockfile のみを確認したい時 |

## local-ci:fast / local-ci:full の使い分け

詳細: [docs/test/LOCAL_CI_LOCAL_PROD.md](../test/LOCAL_CI_LOCAL_PROD.md)

- `local-ci:fast`
  - 開発中に回しやすいモード
  - build + up + smoke + down
  - registry 起動と push を省略
- `local-ci:full`
  - 忠実度重視の確認モード
  - registry 起動 + build + push + up + smoke + down

推奨運用:

- 日常開発: `local-ci:fast`
- リリース前や定期確認: `local-ci:full`

## 失敗時の確認ポイント

- pre-commit が失敗する場合:
  - `pnpm exec lint-staged` を手動実行して原因を確認
  - `pnpm audit` を手動実行して脆弱性の検出状況を確認
  - `pnpm secrets:scan` を手動実行して secret 検出を確認
  - `pnpm osv:scan-lockfiles` を手動実行して lockfile の検出状況を確認
- `pnpm osv:scan-lockfiles` が見つからない場合:
  - `.devcontainer/scripts/install-osv-scanner.sh` を手動実行して OSV-Scanner を再導入する
- pre-push が失敗する場合:
  - `pnpm typecheck` を単体実行
  - `pnpm local-ci:fast` を単体実行

## 3日ルールと緊急例外運用

このリポジトリでは [../../.npmrc](../../.npmrc) により、公開3日未満のパッケージ導入を禁止しています（ゼロデイ対策のため）（`minimum-release-age=4320`）。

そのため、`pnpm audit` / `pnpm osv:scan-lockfiles` で脆弱性が見つかっても、修正版が公開直後だと通常手順では更新できない場合があります。

回避不可能な脆弱性更新が必要な場合は、例外運用手順に従ってください:

- [3日ルール例外運用（脆弱性緊急対応）](SECURITY_EXCEPTION_3DAY_RULE.md)

注意:

- 例外は期限付き・承認付きでのみ実施
- `.npmrc` の一時変更後は必ず元に戻す
- 実施内容は PR/Issue に記録する

## pre-commit / pre-push をスキップして強制実行する方法（緊急時のみ）

原則として hooks のスキップは非推奨です。やむを得ない場合のみ、一時的に使用してください。

### 一時的に 1 回だけスキップする

- commit を強制実行:

```sh
git commit --no-verify
```

- push を強制実行:

```sh
git push --no-verify
```

### Husky を無効化して実行する

環境変数 `HUSKY=0` を付けると、そのコマンド実行中は Husky hooks が実行されません。

```sh
HUSKY=0 git commit -m "skip hooks temporarily"
HUSKY=0 git push
```

## スキップ時の注意事項

- スキップは緊急対応（例: hooks 側の一時不具合）に限定する
- 検証未実施の変更が main 系ブランチに入るリスクが高まる
- `--no-verify` はローカルフックのみ回避するため、CI の必須チェックは別途必要
- スキップ後は必ず手動で次を実行してから PR を更新する

```sh
pnpm typecheck
pnpm lint
pnpm audit
pnpm secrets:scan
pnpm osv:scan-lockfiles
pnpm format:check
pnpm local-ci:fast
```

- スキップした理由と、事後に実施した検証結果を PR に明記する

## 補足

このドキュメントは、現在の hooks 実装に合わせています。hooks や scripts を変更した場合は、関連する次のファイルと一緒に更新してください。

- [package.json](../../package.json)
- [.husky/pre-commit](../../.husky/pre-commit)
- [.husky/pre-push](../../.husky/pre-push)
