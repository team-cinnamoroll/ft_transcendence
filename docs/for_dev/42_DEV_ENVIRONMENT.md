# 42 Ubuntu/Mac 開発環境（特殊環境）での注意点

一般的な Ubuntu や Mac 環境とは異なり、42ネットワーク内の PC (Ubuntu) では、ストレージ容量の制限回避やセキュリティの都合により、Docker の構成が特殊になっています。
本プロジェクトを 42 環境で開発・実行する場合、以下の点に注意して設定を行ってください。

## 通常環境との主な違い

1. **Docker ソケットの場所 (Rootless Docker)**
   - 通常の環境: `/var/run/docker.sock` (root権限で動作)
   - 42環境: `/run/user/$(id -u)/docker.sock` (例: `/run/user/9404/docker.sock`)
   - 影響: Devコンテナ本体や `filebeat` など、コンテナ内からホストの Docker デーモンを操作・監視するコンテナが、ソケットにアクセスできず `permission denied` となります。

2. **Docker データディレクトリの場所 (goinfre)**
   - 通常の環境: `/var/lib/docker`
   - 42環境: `/goinfre/$(whoami)/docker` (例: `/goinfre/katakada/docker`)
   - 影響: `cadvisor` や `filebeat` など、ホスト上のコンテナログやシステムリソースを直接読み取るコンテナが、マウント元を見つけられず、デーモンが `mkdir` を試みて `permission denied` となります。

## 42環境で開発・実行するための設定手順

`docker-compose.dev.yml` は、標準のUbuntuやMac環境でそのまま動くよう設計されています（デフォルトで `/var/run/docker.sock` 等を参照します）。
しかし、42環境で作業する場合はパスが異なるため、プロジェクトルートの `.env` ファイルに以下の変数を追記して、マウント元パスを上書きしてください。

```bash
# .env に以下を追記（もしくは作成）します(変数は事前に実行して固定値で代入してください)
DOCKER_SOCK=/run/user/$(id -u)/docker.sock
DOCKER_ROOT_DIR=/goinfre/$(whoami)/docker
```

### Devコンテナ起動前の必須作業

VS Code の Dev Containers 拡張機能は、コンテナをビルド・起動する際に `.devcontainer` ディレクトリをカレントディレクトリとして Docker Compose を実行します。
そのため、プロジェクトルートの `.env` ファイルが読み込まれず、正しくパスが上書きされません。

これを回避するため、VS Code で Devコンテナを立ち上げる**前**に、必ずホスト側のターミナルで以下のコマンドを実行して `.env` ファイルを `.devcontainer` 配下にもコピーしてください。

```bash
cp .env .devcontainer/.env
```

### Devコンテナでの利用

上記の手順で `.devcontainer/.env` が配置されていれば、VS Code が 42 環境の正しいソケットパス（Rootless ソケット）を Devコンテナにマウントします。
その後、Devコンテナ内で `$ pnpm pg:up` や `$ pnpm elk:up` を実行した際にも、コンテナ内の Docker CLI が正しいソケットを通じて通信し、各監視系コンテナがホストの正しいパスを参照して立ち上がります。

### local-prod (本番相当環境) について

本プロジェクトの制約として「42環境では本番ビルド＆ホストは行わない（本番は通常のUbuntuまたはMacを使用する）」というルールがあるため、本番環境ではこの特殊なパスのオーバーライドは不要です。

## 内部アーキテクチャと全環境両立の仕組み (Technical Background)

本プロジェクトは、42環境特有のエラーを回避しつつ、Macや通常のUbuntuでもコード変更なしで完全に動くよう、高度な適応アーキテクチャを採用しています。

### 1. VS Code 拡張機能の強制上書きのバイパス (`rootless.sock`)

VS Code の `docker-outside-of-docker` 機能は、コンテナ起動時にホストの `/var/run/docker.sock` を強制的にコンテナ内にマウントし、シンボリックリンクで上書きするお節介な仕様があります。
これを回避するため、本プロジェクトでは以下の工夫をしています：

- `docker-compose.dev.yml` でマウント先を意図的に **`/var/run/rootless.sock`** という競合しない名前にずらしています。
- `devcontainer.json` の `remoteEnv` で **`DOCKER_HOST: unix:///var/run/rootless.sock`** を指定し、Docker CLI が安全なソケットを見るように誘導しています。
- **他環境への影響**: Mac等では標準のソケットが `rootless.sock` にマウントされるだけなので、全く問題なく動作します。拡張機能が作成する上書きソケットもそのまま機能するため、完全な後方互換性が保たれています。

### 2. CIスクリプトでの `DOCKER_HOST` の安全な復元

`scripts/local-ci-local-prod.sh` 等でアウターデーモン（ホストのDocker）と通信する際、以前は `unset DOCKER_HOST` として環境変数を強制クリアしていましたが、現在はスクリプト起動前の状態（`ORIGINAL_DOCKER_HOST`）を保存・復元するよう設計されています。

- **他環境への影響**: Macのターミナル等から直接実行した際も、本来のMacの `DOCKER_HOST` が復元されるため、予期せぬソケットエラーを防ぎ安全に動作します。
