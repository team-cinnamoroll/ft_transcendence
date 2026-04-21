# Dev Container メモ

このディレクトリは、このリポジトリの Dev Container 運用でハマりやすい点と対策をまとめます。

## 1. `pnpm install` が `EACCES` で失敗する問題

### 症状
Dev Container 起動時（`postCreateCommand`）の依存インストールで、次のようなエラーが出て失敗することがあります。

- `EACCES: permission denied, mkdir '/workspace/node_modules/.pnpm'`

### 原因
このリポジトリは `docker-compose.dev.yml` で `/workspace/node_modules` を named volume にマウントしています。

- `/workspace` は bind mount（リポジトリ本体）
- `/workspace/node_modules` は named volume（`workspace_node_modules`）

一方、Dev Container 側は `remoteUser: node` を使います。
環境によっては、コンテナ内ユーザー `node` の UID/GID がホスト環境に合わせて変わることがあり、
既存の named volume 側の所有 UID/GID とズレると、`pnpm` が `.pnpm` ディレクトリを作れず `EACCES` になります。

これは GitHub でソースを配布して別マシンで初回起動する場合でも、次の条件が揃うと起こり得ます。

- 過去に作成された named volume が残っている
- その volume の所有 UID/GID が、現在の `node` と一致しない

### 対策（このリポジトリに実装済み）
Dev Container の作成時/起動時に、`/workspace/node_modules` の書き込み権限を自動で整えます。

- `.devcontainer/scripts/fix-node-modules-perms.sh`
  - `node_modules` が書き込み不可の場合に `sudo chown -R <current uid>:<current gid> /workspace/node_modules` を実施
- `.devcontainer/scripts/postCreateCommand.sh`
  - 上記の権限修正 → `corepack enable` → `pnpm install`
- `.devcontainer/devcontainer.json`
  - `postCreateCommand` と `postStartCommand` で上記スクリプトを実行

また、Corepack の初回ダウンロード確認プロンプトで自動実行が止まらないよう、`pnpm install` 実行時に
`COREPACK_ENABLE_DOWNLOAD_PROMPT=0` を指定しています。

さらに `docker-compose.dev.yml` で起動する `backend` / `frontend` の開発コマンドでも、
同じく `COREPACK_ENABLE_DOWNLOAD_PROMPT=0` を付けて、初回起動でプロンプト待ちにならないようにしています。

### 手動での復旧
もし手元の環境で同様の問題が出た場合は、次で復旧できます。

```bash
bash .devcontainer/scripts/fix-node-modules-perms.sh
pnpm install
```

それでも直らない/volume が壊れている場合は、ホスト側で volume を作り直します。

```bash
docker compose -f docker-compose.dev.yml down -v
```

## 注意点（今後拡張する場合）

## 2. Dev Container のビルドで `docker-outside-of-docker` が失敗する問題

### 症状
Dev Container のビルド中に、次のようなエラーで落ちることがあります。

- `The 'moby' option is not supported on Debian 'trixie' ...`

### 原因
Dev Container のベースイメージが Debian `trixie` 系になると、`docker-outside-of-docker` feature の既定設定（`moby=true`）が非対応になり、feature のインストールに失敗します。

### 対策（このリポジトリに実装済み）
`.devcontainer/Dockerfile` のベースイメージを `bookworm` 系に固定しています。

- `remoteUser` を変更する場合
  - UID/GID が変わると同じ問題が再発しやすいので、`postStartCommand` の権限修正は残すのが安全です。
- `sudo` 前提
  - `fix-node-modules-perms.sh` は `sudo` が使える前提で最短復旧します。
    `sudo` を無効化/削除するイメージに変える場合は、代替手段（root での起動、init 時の chown 等）を検討してください。
- `chown -R` のコスト
  - `node_modules` が巨大な場合、再帰 chown は時間がかかります。
    現在の実装は「書き込み不可の場合のみ」実行することで、通常起動時の負担を抑えています。
- マウント構成を変える場合
  - `/workspace` や `/workspace/node_modules` のマウント先を変えたら、スクリプト内のパスも合わせて更新してください。
