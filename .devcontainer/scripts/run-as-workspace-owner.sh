#!/bin/sh
set -e

# /workspaceディレクトリの所有者UID/GIDを取得
WS_UID=$(stat -c "%u" /workspace)
WS_GID=$(stat -c "%g" /workspace)

# Rootless Dockerやuserns-remap環境では、ホスト側のユーザーがコンテナ内の root (0) にマッピングされることがあります。
# その場合、/workspaceの所有者は root (0) となります。
# 権限がない node ユーザーに切り替えると書き込みエラー(EACCES)になるため、そのまま root として実行します。
if [ "$WS_UID" = "0" ]; then
    export HOME=/root
    exec "$@"
fi

# nodeユーザーのUID/GIDが異なる場合、/workspaceの所有者に合わせる
# (Ubuntu等のLinux環境でのボリュームマウント権限エラーを解消するため)
if [ "$WS_UID" != "$(id -u node)" ]; then
    groupmod -o -g "$WS_GID" node >/dev/null 2>&1 || true
    usermod -o -u "$WS_UID" -g "$WS_GID" node >/dev/null 2>&1 || true
    chown -R node:node /home/node >/dev/null 2>&1 || true
fi

# 以前 root 権限で作成されてしまった可能性のあるキャッシュディレクトリの権限を修復
if [ -d "/workspace/containers/apps/frontend-bff/.next" ]; then
    chown -R node:node "/workspace/containers/apps/frontend-bff/.next" >/dev/null 2>&1 || true
fi
if [ -d "/workspace/containers/apps/frontend-bff/.turbo" ]; then
    chown -R node:node "/workspace/containers/apps/frontend-bff/.turbo" >/dev/null 2>&1 || true
fi

# HOME変数がrootのまま引き継がれないように、明示的にnodeユーザーのホームディレクトリを指定する
export HOME=/home/node

# 受け取ったコマンドを node ユーザーとして実行 (環境変数を引き継ぐ)
exec sudo -E -u node -- "$@"
