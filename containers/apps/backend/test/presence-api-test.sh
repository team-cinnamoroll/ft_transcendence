#!/bin/bash

# ==========================================
# 設定・変数定義
# ==========================================
# 異なる環境で実行する場合は、実行時の環境変数で上書き可能
BASE_URL=${BASE_URL:-"http://localhost:8000/api/v1"}
STATE_FILE=".test_state"

# テスト用ユーザーデータ
U1_EMAIL="user1@example.com"
U1_NAME="User One"
U1_PASS="password1234"

U2_EMAIL="user2@example.com"
U2_NAME="User Two"
U2_PASS="password1234"

U3_EMAIL="user3@example.com"
U3_NAME="User Three"
U3_PASS="password1234"

# ==========================================
# ヘルパー関数
# ==========================================
# jqコマンドの存在チェック
if ! command -v jq &> /dev/null; then
    echo "Error: jq がインストールされていません。インストールしてから再実行してください。"
    exit 1
fi

# 状態の保存（個別実行のためにIDとToken、リフレッシュトークンを保持）
save_state() {
    cat <<EOF > "$STATE_FILE"
U1_ID="$U1_ID"
U1_TOKEN="$U1_TOKEN"
U1_REFRESH="$U1_REFRESH"
U2_ID="$U2_ID"
U2_TOKEN="$U2_TOKEN"
U2_REFRESH="$U2_REFRESH"
U3_ID="$U3_ID"
U3_TOKEN="$U3_TOKEN"
U3_REFRESH="$U3_REFRESH"
EOF
}

# 状態の読み込み
load_state() {
    if [ -f "$STATE_FILE" ]; then
        source "$STATE_FILE"
    else
        echo "Error: 状態ファイル ($STATE_FILE) が見つかりません。先に 'setup' を実行してください。"
        exit 1
    fi
}

# ==========================================
# テストブロック
# ==========================================

# 1. 準備 (サインアップ)
setup() {
    echo "=== 【準備】ユーザーのサインアップ ==="

    for i in 1 2 3; do
        eval email=\$U${i}_EMAIL
        eval name=\$U${i}_NAME
        eval pass=\$U${i}_PASS

        echo "Signing up User $i ($email)..."
        RES=$(curl -s -X POST "$BASE_URL/auth/sign-up" \
            -H "Content-Type: application/json" \
            -d "{\"email\":\"$email\",\"name\":\"$name\",\"password\":\"$pass\"}")

        SUCCESS=$(echo "$RES" | jq -r '.success')
        if [ "$SUCCESS" != "true" ]; then
            echo "Failed to sign up User $i. Response: $RES"
            exit 1
        fi

        # トークンとIDを変数に格納
        declare U${i}_TOKEN=$(echo "$RES" | jq -r '.data.accessToken')
        declare U${i}_REFRESH=$(echo "$RES" | jq -r '.data.refreshToken')
        declare U${i}_ID=$(echo "$RES" | jq -r '.data.user.id')

        eval current_id=\$U${i}_ID
        echo "  -> Success! User ID: $current_id"
    done

    save_state
    echo "=> 準備完了。状態を $STATE_FILE に保存しました。"
    echo ""
}

# 2. テスト実行
run_tests() {
    load_state
    echo "=== 【テスト実行】ハートビートとアクティブ状態の確認 ==="

    # --- 1. 全ユーザーのハートビート ---
    echo "[1/6] ユーザー1, 2, 3 のハートビートリクエスト"
    for i in 1 2 3; do
        eval token=\$U${i}_TOKEN
        curl -s -X POST "$BASE_URL/presence/heartbeat" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            -d "{}" > /dev/null
        echo "  -> User $i heartbeat sent."
    done

    # --- 2. アクティブユーザーの確認 (全ユーザーオンライン) ---
    echo "[2/6] アクティブユーザーAPIリクエスト (全員オンラインのはず)"
    curl -s -X POST "$BASE_URL/presence/status" \
        -H "Authorization: Bearer $U1_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"userIds\":[\"$U1_ID\", \"$U2_ID\", \"$U3_ID\"]}" | jq '.data.onlineStatuses'

    # --- 3. ユーザー1のオフラインリクエスト ---
    echo "[3/6] ユーザー1 のオフラインリクエスト"
    curl -s -X POST "$BASE_URL/presence/offline" \
        -H "Authorization: Bearer $U1_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{}" > /dev/null

    # --- 4. アクティブユーザーの確認 (ユーザー1がオフライン) ---
    echo "[4/6] アクティブユーザーAPIリクエスト (ユーザー1がオフラインか確認)"
    curl -s -X POST "$BASE_URL/presence/status" \
        -H "Authorization: Bearer $U2_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"userIds\":[\"$U1_ID\", \"$U2_ID\", \"$U3_ID\"]}" | jq '.data.onlineStatuses'

    # --- 5. ユーザー2, 3のオフラインリクエスト ---
    echo "[5/6] ユーザー2, 3 のオフラインリクエスト"
    for i in 2 3; do
        eval token=\$U${i}_TOKEN
        curl -s -X POST "$BASE_URL/presence/offline" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            -d "{}" > /dev/null
        echo "  -> User $i offline request sent."
    done

    # --- 6. アクティブユーザーの確認 (全ユーザーオフライン) ---
    echo "[6/6] アクティブユーザーAPIリクエスト (全員オフラインか確認)"
    curl -s -X POST "$BASE_URL/presence/status" \
        -H "Authorization: Bearer $U3_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"userIds\":[\"$U1_ID\", \"$U2_ID\", \"$U3_ID\"]}" | jq '.data.onlineStatuses'

    echo ""
}

# 3. 後処理 (ログアウト ＆ ユーザー削除)
cleanup() {
    load_state
    echo "=== 【後処理】全ユーザーのログアウト ＆ アカウント削除 ==="

    # --- 1. ユーザーのログアウト ---
    echo "ログアウト処理を実行中..."
    for i in 1 2 3; do
        eval token=\$U${i}_TOKEN
        eval refresh=\$U${i}_REFRESH

        RES_LOGOUT=$(curl -s -X POST "$BASE_URL/auth/sign-out" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            -d "{\"refreshToken\":\"$refresh\"}")

        SUCCESS_LOGOUT=$(echo "$RES_LOGOUT" | jq -r '.success')
        if [ "$SUCCESS_LOGOUT" = "true" ]; then
            echo "  -> User $i logged out successfully."
        else
            echo "  -> Failed to log out User $i. Response: $RES_LOGOUT"
        fi
    done

    # --- 2. ユーザーの削除 ---
    echo "アカウント削除処理を実行中..."
    for i in 1 2 3; do
        eval id=\$U${i}_ID
        eval token=\$U${i}_TOKEN

        # ステータスコードを取得
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL/users/$id" \
            -H "Authorization: Bearer $token")

        if [ "$HTTP_STATUS" -eq 204 ]; then
            echo "  -> User $i (ID: $id) deleted successfully (204)."
        else
            echo "  -> Failed to delete User $i. HTTP Status: $HTTP_STATUS"
        fi
    done

    # 状態ファイルの削除
    rm -f "$STATE_FILE"
    echo "=> 後処理完了。状態ファイルを削除しました。"
    echo ""
}

# ==========================================
# コマンドのルーティング
# ==========================================
case "$1" in
    setup)
        setup
        ;;
    test)
        run_tests
        ;;
    cleanup)
        cleanup
        ;;
    all)
        setup
        run_tests
        cleanup
        ;;
    *)
        echo "使用方法: $0 {setup|test|cleanup|all}"
        echo "  setup   : 準備（アカウント作成とトークン取得）"
        echo "  test    : テスト実行（ハートビートとオフライン状態の確認）"
        echo "  cleanup : 後処理（ログアウトとアカウントの削除）"
        echo "  all     : setup -> test -> cleanup を一括で実行"
        exit 1
        ;;
esac
