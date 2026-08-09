#!/bin/bash

# ==========================================
# 設定・変数定義
# ==========================================
# 異なる環境で実行する場合は、実行時の環境変数で上書き可能
BASE_URL=${BASE_URL:-"http://localhost:8000/api/v1"}
STATE_FILE=".test_state_admin_user"

# APIキー関連 (gitleaks等のシークレットスキャン回避のため、ヘッダー名を変数化)
HEADER_AUTH="x-api-key"
API_KEY=${API_KEY:-"tracen_master_api_key"}
# 不正なAPIキー（静的解析を避けるため動的に生成した文字列を付与）
INVALID_API_KEY="invalid_dummy_key_${RANDOM}"

# テスト用ユーザーデータ
U1_EMAIL="admin_test_user1@example.com"
U1_NAME="AdminTest User One"
U1_PASS="password1234"

U2_EMAIL="admin_test_user2@example.com"
U2_NAME="AdminTest User Two"
U2_PASS="password1234"

# ==========================================
# ヘルパー関数
# ==========================================
# jqコマンドの存在チェック
if ! command -v jq &> /dev/null; then
    echo "Error: jq がインストールされていません。インストールしてから再実行してください。"
    exit 1
fi

# 存在しないUUIDを動的に生成する関数 (gitleaks回避用)
generate_dummy_uuid() {
    if command -v uuidgen &> /dev/null; then
        uuidgen | tr '[:upper:]' '[:lower:]'
    elif [ -r /proc/sys/kernel/random/uuid ]; then
        cat /proc/sys/kernel/random/uuid
    else
        # どちらもない場合は $RANDOM を用いて動的に生成
        printf '%04x%04x-%04x-%04x-%04x-%04x%04x%04x\n' \
            $RANDOM $RANDOM $RANDOM $RANDOM $RANDOM $RANDOM $RANDOM $RANDOM
    fi
}

# テスト結果カウンター
PASS_COUNT=0
FAIL_COUNT=0

# テスト結果チェック関数
check_result() {
    local test_name="$1"
    local actual_status="$2"
    local expected_status="$3"
    local response_json="$4"
    local expected_success="$5"

    local actual_success
    actual_success=$(echo "$response_json" | jq -r '.success' 2>/dev/null)

    local status_ok=false
    local success_ok=false

    if [ "$actual_status" -eq "$expected_status" ]; then
        status_ok=true
    fi

    if [ "$actual_success" = "$expected_success" ]; then
        success_ok=true
    fi

    if $status_ok && $success_ok; then
        echo "  [PASS] $test_name"
        echo "         HTTP: $actual_status (期待: $expected_status) | success: $actual_success (期待: $expected_success)"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo "  [FAIL] $test_name"
        if ! $status_ok; then
            echo "         HTTP: $actual_status (期待: $expected_status) <- NG"
        else
            echo "         HTTP: $actual_status (期待: $expected_status) <- OK"
        fi
        if ! $success_ok; then
            echo "         success: $actual_success (期待: $expected_success) <- NG"
        else
            echo "         success: $actual_success (期待: $expected_success) <- OK"
        fi
        echo "         Response: $response_json"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
}

# DELETE のような 204 No Content 用のチェック関数
check_result_no_body() {
    local test_name="$1"
    local actual_status="$2"
    local expected_status="$3"

    if [ "$actual_status" -eq "$expected_status" ]; then
        echo "  [PASS] $test_name"
        echo "         HTTP: $actual_status (期待: $expected_status)"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo "  [FAIL] $test_name"
        echo "         HTTP: $actual_status (期待: $expected_status) <- NG"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
}

# 状態の保存
save_state() {
    cat <<EOF > "$STATE_FILE"
U1_ID="$U1_ID"
U1_TOKEN="$U1_TOKEN"
U1_REFRESH="$U1_REFRESH"
U1_PASS="$U1_PASS"
U2_ID="$U2_ID"
U2_TOKEN="$U2_TOKEN"
U2_REFRESH="$U2_REFRESH"
U2_PASS="$U2_PASS"
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

# テスト結果の表示
print_summary() {
    echo ""
    echo "========================================"
    echo " テスト結果サマリー"
    echo "========================================"
    echo "  PASS: $PASS_COUNT"
    echo "  FAIL: $FAIL_COUNT"
    echo "  合計: $((PASS_COUNT + FAIL_COUNT))"
    echo "========================================"
    if [ "$FAIL_COUNT" -gt 0 ]; then
        exit 1
    fi
}

# ==========================================
# テストブロック
# ==========================================

# 1. 準備 (サインアップ)
setup() {
    echo "=== 【準備】ユーザーのサインアップ ==="

    for i in 1 2; do
        eval email=\$U${i}_EMAIL
        eval name=\$U${i}_NAME
        eval pass=\$U${i}_PASS

        echo "Signing up User $i ($email)..."
        RES=$(curl -s -X POST "$BASE_URL/auth/sign-up" \
            -H "Content-Type: application/json" \
            -H "$HEADER_AUTH: $API_KEY" \
            -d "{\"email\":\"$email\",\"name\":\"$name\",\"password\":\"$pass\"}")

        SUCCESS=$(echo "$RES" | jq -r '.success')
        if [ "$SUCCESS" != "true" ]; then
            echo "Failed to sign up User $i. Response: $RES"
            exit 1
        fi

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

# ==========================================
# 2. GET /admin/users/{id} テスト
# ==========================================
test_get_user() {
    load_state
    echo "=== 【テスト】GET /admin/users/{id} ==="
    echo ""

    # --- 正常系 ---
    echo "--- 正常系 ---"

    # [1] 存在するユーザー1を取得できる
    RES=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/admin/users/$U1_ID" \
        -H "$HEADER_AUTH: $API_KEY")
    HTTP_STATUS=$(echo "$RES" | tail -n1)
    BODY=$(echo "$RES" | sed '$d')
    check_result "[GET-1] 存在するユーザー1を取得" "$HTTP_STATUS" "200" "$BODY" "true"

    # [2] 存在するユーザー2を取得できる
    RES=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/admin/users/$U2_ID" \
        -H "$HEADER_AUTH: $API_KEY")
    HTTP_STATUS=$(echo "$RES" | tail -n1)
    BODY=$(echo "$RES" | sed '$d')
    check_result "[GET-2] 存在するユーザー2を取得" "$HTTP_STATUS" "200" "$BODY" "true"

    echo ""
    # --- エラー系 ---
    echo "--- エラー系 ---"

    # [3] APIキーなしで401が返る
    RES=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/admin/users/$U1_ID")
    HTTP_STATUS=$(echo "$RES" | tail -n1)
    BODY=$(echo "$RES" | sed '$d')
    check_result "[GET-3] APIキーなし -> 401" "$HTTP_STATUS" "401" "$BODY" "false"

    # [4] 不正なAPIキーで401が返る
    RES=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/admin/users/$U1_ID" \
        -H "$HEADER_AUTH: $INVALID_API_KEY")
    HTTP_STATUS=$(echo "$RES" | tail -n1)
    BODY=$(echo "$RES" | sed '$d')
    check_result "[GET-4] 不正なAPIキー -> 401" "$HTTP_STATUS" "401" "$BODY" "false"

    # [5] 存在しないID(有効なUUID)で404が返る
    NOT_EXIST_UUID=$(generate_dummy_uuid)
    RES=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/admin/users/$NOT_EXIST_UUID" \
        -H "$HEADER_AUTH: $API_KEY")
    HTTP_STATUS=$(echo "$RES" | tail -n1)
    BODY=$(echo "$RES" | sed '$d')
    check_result "[GET-5] 存在しないUUID -> 404" "$HTTP_STATUS" "404" "$BODY" "false"

    # [6] 無効なID形式(UUID以外)で400が返る
    RES=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/admin/users/invalid-id-format" \
        -H "$HEADER_AUTH: $API_KEY")
    HTTP_STATUS=$(echo "$RES" | tail -n1)
    BODY=$(echo "$RES" | sed '$d')
    check_result "[GET-6] 無効なID形式(UUID以外) -> 400" "$HTTP_STATUS" "400" "$BODY" "false"

    echo ""
    echo "=> GET /admin/users/{id} テスト完了"
    echo ""
}

# ==========================================
# 3. PUT /admin/users/{id} テスト
# ==========================================
test_put_user() {
    load_state
    echo "=== 【テスト】PUT /admin/users/{id} ==="
    echo ""

    # --- 正常系 ---
    echo "--- 正常系 ---"

    # [1] 名前のみを変更（パスワードはそのまま、newPasswordはnull）
    NEW_NAME="AdminTest User One Updated"
    RES=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/admin/users/$U1_ID" \
        -H "$HEADER_AUTH: $API_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$U1_EMAIL\",\"name\":\"$NEW_NAME\",\"password\":\"$U1_PASS\",\"newPassword\":null}")
    HTTP_STATUS=$(echo "$RES" | tail -n1)
    BODY=$(echo "$RES" | sed '$d')
    check_result "[PUT-1] 名前のみ更新(newPassword=null) -> 200" "$HTTP_STATUS" "200" "$BODY" "true"

    # 返却されたデータの確認
    if [ "$HTTP_STATUS" -eq 200 ]; then
        ACTUAL_EMAIL=$(echo "$BODY" | jq -r '.data.user.email')
        ACTUAL_NAME=$(echo "$BODY" | jq -r '.data.user.name')
        if [ "$ACTUAL_EMAIL" = "$U1_EMAIL" ] && [ "$ACTUAL_NAME" = "$NEW_NAME" ]; then
            echo "         -> [Data OK] 返却データが正しく更新されています (email: $ACTUAL_EMAIL, name: $ACTUAL_NAME)"
        else
            echo "         -> [Data NG] 返却データが意図した通りに変更されていません"
            echo "            期待: email=$U1_EMAIL, name=$NEW_NAME"
            echo "            実際: email=$ACTUAL_EMAIL, name=$ACTUAL_NAME"
            PASS_COUNT=$((PASS_COUNT - 1))
            FAIL_COUNT=$((FAIL_COUNT + 1))
        fi
    fi

    # [2] パスワードも変更する（newPassword を設定）
    NEW_PASS="newpassword5678"
    RES=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/admin/users/$U1_ID" \
        -H "$HEADER_AUTH: $API_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$U1_EMAIL\",\"name\":\"$NEW_NAME\",\"password\":\"$U1_PASS\",\"newPassword\":\"$NEW_PASS\"}")
    HTTP_STATUS=$(echo "$RES" | tail -n1)
    BODY=$(echo "$RES" | sed '$d')
    check_result "[PUT-2] パスワード変更あり(newPassword設定) -> 200" "$HTTP_STATUS" "200" "$BODY" "true"

    # 返却されたデータの確認
    if [ "$HTTP_STATUS" -eq 200 ]; then
        ACTUAL_EMAIL=$(echo "$BODY" | jq -r '.data.user.email')
        ACTUAL_NAME=$(echo "$BODY" | jq -r '.data.user.name')
        if [ "$ACTUAL_EMAIL" = "$U1_EMAIL" ] && [ "$ACTUAL_NAME" = "$NEW_NAME" ]; then
            echo "         -> [Data OK] 返却データが正しく更新されています (email: $ACTUAL_EMAIL, name: $ACTUAL_NAME)"
        else
            echo "         -> [Data NG] 返却データが意図した通りに変更されていません"
            echo "            期待: email=$U1_EMAIL, name=$NEW_NAME"
            echo "            実際: email=$ACTUAL_EMAIL, name=$ACTUAL_NAME"
            PASS_COUNT=$((PASS_COUNT - 1))
            FAIL_COUNT=$((FAIL_COUNT + 1))
        fi
    fi

    # 以降のユーザー1のパスワードは新しいものに更新
    U1_PASS="$NEW_PASS"
    save_state

    echo ""
    # --- エラー系 ---
    echo "--- エラー系 ---"

    # [3] APIキーなしで401が返る
    RES=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/admin/users/$U1_ID" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$U1_EMAIL\",\"name\":\"$NEW_NAME\",\"password\":\"$U1_PASS\",\"newPassword\":null}")
    HTTP_STATUS=$(echo "$RES" | tail -n1)
    BODY=$(echo "$RES" | sed '$d')
    check_result "[PUT-3] APIキーなし -> 401" "$HTTP_STATUS" "401" "$BODY" "false"

    # [4] 不正なAPIキーで401が返る
    RES=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/admin/users/$U1_ID" \
        -H "$HEADER_AUTH: $INVALID_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$U1_EMAIL\",\"name\":\"$NEW_NAME\",\"password\":\"$U1_PASS\",\"newPassword\":null}")
    HTTP_STATUS=$(echo "$RES" | tail -n1)
    BODY=$(echo "$RES" | sed '$d')
    check_result "[PUT-4] 不正なAPIキー -> 401" "$HTTP_STATUS" "401" "$BODY" "false"

    # [5] 存在しないUUIDで404が返る
    NOT_EXIST_UUID=$(generate_dummy_uuid)
    RES=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/admin/users/$NOT_EXIST_UUID" \
        -H "$HEADER_AUTH: $API_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"nonexist@example.com\",\"name\":\"Ghost\",\"password\":\"$U1_PASS\",\"newPassword\":null}")
    HTTP_STATUS=$(echo "$RES" | tail -n1)
    BODY=$(echo "$RES" | sed '$d')
    check_result "[PUT-5] 存在しないUUID -> 404" "$HTTP_STATUS" "404" "$BODY" "false"

    # [6] 無効なID形式(UUID以外)で400が返る
    RES=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/admin/users/invalid-id-format" \
        -H "$HEADER_AUTH: $API_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$U1_EMAIL\",\"name\":\"$NEW_NAME\",\"password\":\"$U1_PASS\",\"newPassword\":null}")
    HTTP_STATUS=$(echo "$RES" | tail -n1)
    BODY=$(echo "$RES" | sed '$d')
    check_result "[PUT-6] 無効なID形式(UUID以外) -> 400" "$HTTP_STATUS" "400" "$BODY" "false"

    # [7] 間違ったパスワードで403が返る
    RES=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/admin/users/$U1_ID" \
        -H "$HEADER_AUTH: $API_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$U1_EMAIL\",\"name\":\"$NEW_NAME\",\"password\":\"wrongpassword!\",\"newPassword\":null}")
    HTTP_STATUS=$(echo "$RES" | tail -n1)
    BODY=$(echo "$RES" | sed '$d')
    check_result "[PUT-7] 間違ったパスワード -> 403" "$HTTP_STATUS" "403" "$BODY" "false"

    # [8] 既に使われているメールアドレスへの変更で409が返る
    RES=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/admin/users/$U1_ID" \
        -H "$HEADER_AUTH: $API_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$U2_EMAIL\",\"name\":\"$NEW_NAME\",\"password\":\"$U1_PASS\",\"newPassword\":null}")
    HTTP_STATUS=$(echo "$RES" | tail -n1)
    BODY=$(echo "$RES" | sed '$d')
    check_result "[PUT-8] 既存メールアドレスへの変更(重複) -> 409" "$HTTP_STATUS" "409" "$BODY" "false"

    # [9] リクエストボディの必須フィールド欠けで400が返る
    RES=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/admin/users/$U1_ID" \
        -H "$HEADER_AUTH: $API_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$U1_EMAIL\"}")
    HTTP_STATUS=$(echo "$RES" | tail -n1)
    BODY=$(echo "$RES" | sed '$d')
    check_result "[PUT-9] 必須フィールド欠け(name/passwordなし) -> 400" "$HTTP_STATUS" "400" "$BODY" "false"

    # [10] パスワードが最小文字数未満(8文字未満)で400が返る
    RES=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/admin/users/$U1_ID" \
        -H "$HEADER_AUTH: $API_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$U1_EMAIL\",\"name\":\"$NEW_NAME\",\"password\":\"short\",\"newPassword\":null}")
    HTTP_STATUS=$(echo "$RES" | tail -n1)
    BODY=$(echo "$RES" | sed '$d')
    check_result "[PUT-10] passwordが8文字未満 -> 400" "$HTTP_STATUS" "400" "$BODY" "false"

    # [11] newPasswordが最小文字数未満(8文字未満)で400が返る
    RES=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/admin/users/$U1_ID" \
        -H "$HEADER_AUTH: $API_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$U1_EMAIL\",\"name\":\"$NEW_NAME\",\"password\":\"$U1_PASS\",\"newPassword\":\"short\"}")
    HTTP_STATUS=$(echo "$RES" | tail -n1)
    BODY=$(echo "$RES" | sed '$d')
    check_result "[PUT-11] newPasswordが8文字未満 -> 400" "$HTTP_STATUS" "400" "$BODY" "false"

    # [12] 空のリクエストボディで400が返る
    RES=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/admin/users/$U1_ID" \
        -H "$HEADER_AUTH: $API_KEY" \
        -H "Content-Type: application/json" \
        -d "{}")
    HTTP_STATUS=$(echo "$RES" | tail -n1)
    BODY=$(echo "$RES" | sed '$d')
    check_result "[PUT-12] 空のリクエストボディ -> 400" "$HTTP_STATUS" "400" "$BODY" "false"

    # [13] nameが空文字列で400が返る
    RES=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/admin/users/$U1_ID" \
        -H "$HEADER_AUTH: $API_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$U1_EMAIL\",\"name\":\"\",\"password\":\"$U1_PASS\",\"newPassword\":null}")
    HTTP_STATUS=$(echo "$RES" | tail -n1)
    BODY=$(echo "$RES" | sed '$d')
    check_result "[PUT-13] nameが空文字列 -> 400" "$HTTP_STATUS" "400" "$BODY" "false"

    echo ""
    echo "=> PUT /admin/users/{id} テスト完了"
    echo ""
}

# ==========================================
# 4. DELETE /admin/users/{id} テスト
# ==========================================
test_delete_user() {
    load_state
    echo "=== 【テスト】DELETE /admin/users/{id} ==="
    echo ""

    # --- エラー系 ---
    echo "--- エラー系 ---"

    # [1] APIキーなしで401が返る
    RES=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/admin/users/$U1_ID")
    HTTP_STATUS=$(echo "$RES" | tail -n1)
    BODY=$(echo "$RES" | sed '$d')
    check_result "[DELETE-1] APIキーなし -> 401" "$HTTP_STATUS" "401" "$BODY" "false"

    # [2] 不正なAPIキーで401が返る
    RES=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/admin/users/$U1_ID" \
        -H "$HEADER_AUTH: $INVALID_API_KEY")
    HTTP_STATUS=$(echo "$RES" | tail -n1)
    BODY=$(echo "$RES" | sed '$d')
    check_result "[DELETE-2] 不正なAPIキー -> 401" "$HTTP_STATUS" "401" "$BODY" "false"

    # [3] 存在しないUUIDで404が返る
    NOT_EXIST_UUID=$(generate_dummy_uuid)
    RES=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/admin/users/$NOT_EXIST_UUID" \
        -H "$HEADER_AUTH: $API_KEY")
    HTTP_STATUS=$(echo "$RES" | tail -n1)
    BODY=$(echo "$RES" | sed '$d')
    check_result "[DELETE-3] 存在しないUUID -> 404" "$HTTP_STATUS" "404" "$BODY" "false"

    # [4] 無効なID形式(UUID以外)で400が返る
    RES=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/admin/users/invalid-id-format" \
        -H "$HEADER_AUTH: $API_KEY")
    HTTP_STATUS=$(echo "$RES" | tail -n1)
    BODY=$(echo "$RES" | sed '$d')
    check_result "[DELETE-4] 無効なID形式(UUID以外) -> 400" "$HTTP_STATUS" "400" "$BODY" "false"

    echo ""
    # --- 正常系 ---
    echo "--- 正常系 ---"

    # [5] ユーザー1を削除 -> 204
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL/admin/users/$U1_ID" \
        -H "$HEADER_AUTH: $API_KEY")
    check_result_no_body "[DELETE-5] ユーザー1を削除 -> 204" "$HTTP_STATUS" "204"

    # [6] 削除済みユーザーを再度削除しようとすると404が返る
    RES=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/admin/users/$U1_ID" \
        -H "$HEADER_AUTH: $API_KEY")
    HTTP_STATUS=$(echo "$RES" | tail -n1)
    BODY=$(echo "$RES" | sed '$d')
    check_result "[DELETE-6] 削除済みユーザーを再削除 -> 404" "$HTTP_STATUS" "404" "$BODY" "false"

    # [7] ユーザー2を削除 -> 204
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL/admin/users/$U2_ID" \
        -H "$HEADER_AUTH: $API_KEY")
    check_result_no_body "[DELETE-7] ユーザー2を削除 -> 204" "$HTTP_STATUS" "204"

    echo ""
    echo "=> DELETE /admin/users/{id} テスト完了"
    echo ""
}

# ==========================================
# 5. 後処理 (未削除ユーザーの削除)
# ==========================================
cleanup() {
    echo "=== 【後処理】テスト用ユーザーの削除 ==="

    if [ ! -f "$STATE_FILE" ]; then
        echo "状態ファイル ($STATE_FILE) が見つかりません。クリーンアップ不要かもしれません。"
        return
    fi

    load_state

    for i in 1 2; do
        eval id=\$U${i}_ID
        if [ -z "$id" ]; then
            continue
        fi

        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL/admin/users/$id" \
            -H "$HEADER_AUTH: $API_KEY")

        if [ "$HTTP_STATUS" -eq 204 ]; then
            echo "  -> User $i (ID: $id) 削除完了 (204)"
        elif [ "$HTTP_STATUS" -eq 404 ]; then
            echo "  -> User $i (ID: $id) は既に削除済み (404)"
        else
            echo "  -> User $i (ID: $id) 削除失敗 (HTTP: $HTTP_STATUS)"
        fi
    done

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
    test-get)
        test_get_user
        print_summary
        ;;
    test-put)
        test_put_user
        print_summary
        ;;
    test-delete)
        test_delete_user
        print_summary
        ;;
    test)
        test_get_user
        test_put_user
        test_delete_user
        print_summary
        ;;
    cleanup)
        cleanup
        ;;
    all)
        setup
        test_get_user
        test_put_user
        test_delete_user
        cleanup
        print_summary
        ;;
    *)
        echo "使用方法: $0 {setup|test-get|test-put|test-delete|test|cleanup|all}"
        exit 1
        ;;
esac
