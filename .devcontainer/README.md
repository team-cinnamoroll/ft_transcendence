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

Dev Container の作成時/起動時に、root で初期化してから `node` ユーザーへ切り替える流れにしています。

- `.devcontainer/scripts/dev-container-bootstrap.sh`
  - 起動直後に `node_modules` の named volume と `docker.sock` のグループ整合を root で初期化します
- `.devcontainer/scripts/fix-node-modules-perms.sh`
  - `node_modules` が書き込み不可の場合に、root 実行時は修復し、非 root 実行時は再起動を促します
- `.devcontainer/scripts/fix-docker-sock-perms.sh`
  - `/var/run/docker.sock` の接続可否を確認し、root 実行時は Docker グループを合わせます
- `.devcontainer/scripts/postCreateCommand.sh`
  - `corepack pnpm install`
- `.devcontainer/devcontainer.json`
  - `postCreateCommand` で依存関係を入れ、`postStartCommand` は起動確認だけにしています

また、Corepack の初回ダウンロード確認プロンプトで自動実行が止まらないよう、`pnpm install` 実行時に
`COREPACK_ENABLE_DOWNLOAD_PROMPT=0` を指定しています。

さらに `docker-compose.dev.yml` で起動する `backend` / `frontend` の開発コマンドでも、
同じく `COREPACK_ENABLE_DOWNLOAD_PROMPT=0` を付けて、初回起動でプロンプト待ちにならないようにしています。

### 手動での復旧

もし手元の環境で同様の問題が出た場合は、次で復旧できます。

```bash
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up -d --force-recreate dev-container backend frontend nginx db redis
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
- `docker.sock` は Docker デーモンの再起動や Docker Desktop の再起動で作り直されるため、`local-ci` 実行前に接続可否を確認しています。
- `sudo` 非前提
  - この構成では `sudo` を使わず、コンテナ起動時の root 初期化で volume と Docker グループを整えます。
- `chown -R` のコスト
  - `node_modules` が巨大な場合、再帰 chown は時間がかかります。
    現在の実装は「書き込み不可の場合のみ」実行することで、通常起動時の負担を抑えています。
- マウント構成を変える場合
  - `/workspace` や `/workspace/node_modules` のマウント先を変えたら、スクリプト内のパスも合わせて更新してください。
