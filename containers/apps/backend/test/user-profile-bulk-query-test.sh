#!/bin/bash

# ==========================================
# 設定・変数定義
# ==========================================
BASE_URL=${BASE_URL:-"http://localhost:8000/api/v1"}
STATE_FILE=".test_state_bulk"
TOTAL_USERS=101
TEMP_RES="temp_res.json"

# ==========================================
# ヘルパー関数
# ==========================================
# jqコマンドの存在チェック
if ! command -v jq &> /dev/null; then
    echo "Error: jq がインストールされていません。インストールしてから再実行してください。"
    exit 1
fi

# UUIDv4を生成する関数（存在しないIDのモック用）
generate_uuid() {
    if command -v uuidgen >/dev/null 2>&1; then
        uuidgen | tr 'A-Z' 'a-z'
    elif [ -f /proc/sys/kernel/random/uuid ]; then
        cat /proc/sys/kernel/random/uuid
    else
        # 最終フォールバック用（厳密なUUIDv4ではないがテストには十分）
        echo "12345678-1234-4000-8000-$(printf "%012x" $RANDOM$RANDOM)"
    fi
}

# 状態の読み込み
load_state() {
    if [ ! -f "$STATE_FILE" ]; then
        echo "Error: 状態ファイル ($STATE_FILE) が見つかりません。先に 'setup' を実行してください。"
        exit 1
    fi

    USER_IDS=()
    USER_TOKENS=()
    USER_REFRESH=()

    while read -r id token refresh; do
        USER_IDS+=("$id")
        USER_TOKENS+=("$token")
        USER_REFRESH+=("$refresh")
    done < "$STATE_FILE"
}

# ==========================================
# テストブロック
# ==========================================

# 1. 準備 (サインアップ)
setup() {
    echo "=== 【準備】 $TOTAL_USERS 件のユーザーサインアップ ==="
    rm -f "$STATE_FILE"

    for i in $(seq 1 $TOTAL_USERS); do
        email="testuser_${i}_$(date +%s)@example.com"
        name="Test User $i"
        pass="password1234"

        # 進捗を10件ごとに表示（ログが長くなりすぎるのを防ぐ）
        if [ $((i % 10)) -eq 0 ] || [ $i -eq 1 ] || [ $i -eq $TOTAL_USERS ]; then
            echo "Signing up User $i / $TOTAL_USERS ..."
        fi

        RES=$(curl -s -X POST "$BASE_URL/auth/sign-up" \
            -H "Content-Type: application/json" \
            -d "{\"email\":\"$email\",\"name\":\"$name\",\"password\":\"$pass\"}")

        SUCCESS=$(echo "$RES" | jq -r '.success')
        if [ "$SUCCESS" != "true" ]; then
            echo "Failed to sign up User $i. Response: $RES"
            exit 1
        fi

        id=$(echo "$RES" | jq -r '.data.user.id')
        token=$(echo "$RES" | jq -r '.data.accessToken')
        refresh=$(echo "$RES" | jq -r '.data.refreshToken')

        # ファイルに書き出し (ID, Token, Refresh のスペース区切り)
        echo "$id $token $refresh" >> "$STATE_FILE"
    done

    echo "=> 準備完了。状態を $STATE_FILE に保存しました。"
    echo ""
}

# 2. テスト実行
run_tests() {
    load_state
    echo "=== 【テスト実行】 バルクプロフィール取得APIの確認 ==="

    # リクエスト主のトークン（ユーザー1）
    AUTH_TOKEN="${USER_TOKENS[0]}"

    # --- テスト1: 100件の正常リクエスト ---
    echo "[1/4] 100件のリクエスト (全て存在するID)"
    IDS_100=$(IFS=, ; echo "${USER_IDS[*]:0:100}")

    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" -X GET "$BASE_URL/user-profile/profiles?ids=$IDS_100" \
        -H "Authorization: Bearer $AUTH_TOKEN")

    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    PROFILE_COUNT=$(jq -r '[.data.profileMap | to_entries[]] | length' "$TEMP_RES")

    echo "  -> HTTP Status: $HTTP_STATUS (Expected: 200)"
    echo "  -> Success: $SUCCESS (Expected: true)"
    echo "  -> 取得したプロフィール件数: $PROFILE_COUNT (Expected: 100)"

    if [ "$HTTP_STATUS" -eq 200 ] && [ "$SUCCESS" = "true" ] && [ "$PROFILE_COUNT" -eq 100 ]; then
        echo "  => [PASS] テスト1 成功"
    else
        echo "  => [FAIL] テスト1 失敗"
        cat "$TEMP_RES"
    fi
    echo ""

    # --- テスト2: 101件のリクエスト (上限エラー) ---
    echo "[2/4] 101件のリクエスト (最大取得件数超過エラーの確認)"
    IDS_101=$(IFS=, ; echo "${USER_IDS[*]:0:101}")

    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" -X GET "$BASE_URL/user-profile/profiles?ids=$IDS_101" \
        -H "Authorization: Bearer $AUTH_TOKEN")

    SUCCESS=$(jq -r '.success' "$TEMP_RES")

    echo "  -> HTTP Status: $HTTP_STATUS (Expected: 400)"
    echo "  -> Success: $SUCCESS (Expected: false)"

    if [ "$HTTP_STATUS" -eq 400 ] && [ "$SUCCESS" = "false" ]; then
        echo "  => [PASS] テスト2 成功"
    else
        echo "  => [FAIL] テスト2 失敗"
        cat "$TEMP_RES"
    fi
    echo ""

    # --- テスト3: 50件正常 + 50件存在しないUUID ---
    echo "[3/4] 100件のリクエスト (50件は存在するID, 50件は存在しないID)"

    COMBINED_IDS=()
    for i in {0..49}; do
        COMBINED_IDS+=("${USER_IDS[$i]}")
    done
    for i in {1..50}; do
        COMBINED_IDS+=("$(generate_uuid)")
    done

    IDS_MIX=$(IFS=, ; echo "${COMBINED_IDS[*]}")

    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" -X GET "$BASE_URL/user-profile/profiles?ids=$IDS_MIX" \
        -H "Authorization: Bearer $AUTH_TOKEN")

    SUCCESS=$(jq -r '.success' "$TEMP_RES")

    VALID_COUNT=$(jq -r '[.data.profileMap | to_entries[] | select(.value != null)] | length' "$TEMP_RES")
    NULL_COUNT=$(jq -r '[.data.profileMap | to_entries[] | select(.value == null)] | length' "$TEMP_RES")

    echo "  -> HTTP Status: $HTTP_STATUS (Expected: 200)"
    echo "  -> Success: $SUCCESS (Expected: true)"
    echo "  -> 存在するプロフィールの数: $VALID_COUNT (Expected: 50)"
    echo "  -> null(存在しない)の数: $NULL_COUNT (Expected: 50)"

    if [ "$HTTP_STATUS" -eq 200 ] && [ "$SUCCESS" = "true" ] && [ "$VALID_COUNT" -eq 50 ] && [ "$NULL_COUNT" -eq 50 ]; then
        echo "  => [PASS] テスト3 成功"
    else
        echo "  => [FAIL] テスト3 失敗"
        cat "$TEMP_RES"
    fi
    echo ""

    # --- テスト4: Relationshipステータスの網羅的確認 ---
    echo "[4/4] Relationshipステータスの網羅的確認"

    # 対象ユーザーの割り当て
    U1_ID="${USER_IDS[0]}" ; U1_TOKEN="${USER_TOKENS[0]}" # リクエスト主 (SELF)
    U2_ID="${USER_IDS[1]}" ; U2_TOKEN="${USER_TOKENS[1]}" # リクエスト主へフレンド申請 (PENDING_INCOMING)
    U3_ID="${USER_IDS[2]}" ; U3_TOKEN="${USER_TOKENS[2]}" # リクエスト主からフレンド申請 (PENDING_OUTGOING)
    U4_ID="${USER_IDS[3]}" ; U4_TOKEN="${USER_TOKENS[3]}" # リクエスト主とフレンド (FRIEND)
    U5_ID="${USER_IDS[4]}" ; U5_TOKEN="${USER_TOKENS[4]}" # リクエスト主からの申請をブロック (BLOCKED_BY)
    U6_ID="${USER_IDS[5]}" ; U6_TOKEN="${USER_TOKENS[5]}" # リクエスト主へ申請しブロックされた (BLOCKED)
    U7_ID="${USER_IDS[6]}"                                # 何もしていない (NONE)

    # 1. PENDING_INCOMING: U2 -> U1 に申請
    RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/friendships/requests" \
        -H "Authorization: Bearer $U2_TOKEN" -H "Content-Type: application/json" -d "{\"addresseeId\": \"$U1_ID\"}")
    if [ "$(echo "$RES" | tail -n1)" -ne 201 ]; then echo "Failed U2->U1 request."; exit 1; fi

    # 2. PENDING_OUTGOING: U1 -> U3 に申請
    RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/friendships/requests" \
        -H "Authorization: Bearer $U1_TOKEN" -H "Content-Type: application/json" -d "{\"addresseeId\": \"$U3_ID\"}")
    if [ "$(echo "$RES" | tail -n1)" -ne 201 ]; then echo "Failed U1->U3 request."; exit 1; fi

    # 3. FRIEND: U1 -> U4 に申請 ＆ U4 が承認
    RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/friendships/requests" \
        -H "Authorization: Bearer $U1_TOKEN" -H "Content-Type: application/json" -d "{\"addresseeId\": \"$U4_ID\"}")
    F_ID=$(echo "$RES" | sed '$d' | jq -r '.data.friendship.id')
    RES=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE_URL/friendships/requests/$F_ID/accept" \
        -H "Authorization: Bearer $U4_TOKEN")
    if [ "$(echo "$RES" | tail -n1)" -ne 200 ]; then echo "Failed U4 accept."; exit 1; fi

    # 4. BLOCKED_BY: U1 -> U5 に申請 ＆ U5 が拒否
    RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/friendships/requests" \
        -H "Authorization: Bearer $U1_TOKEN" -H "Content-Type: application/json" -d "{\"addresseeId\": \"$U5_ID\"}")
    F_ID=$(echo "$RES" | sed '$d' | jq -r '.data.friendship.id')
    RES=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/friendships/requests/$F_ID" \
        -H "Authorization: Bearer $U5_TOKEN")
    if [ "$(echo "$RES" | tail -n1)" -ne 200 ]; then echo "Failed U5 reject."; exit 1; fi

    # 5. BLOCKED: U6 -> U1 に申請 ＆ U1 が拒否
    RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/friendships/requests" \
        -H "Authorization: Bearer $U6_TOKEN" -H "Content-Type: application/json" -d "{\"addresseeId\": \"$U1_ID\"}")
    F_ID=$(echo "$RES" | sed '$d' | jq -r '.data.friendship.id')
    RES=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/friendships/requests/$F_ID" \
        -H "Authorization: Bearer $U1_TOKEN")
    if [ "$(echo "$RES" | tail -n1)" -ne 200 ]; then echo "Failed U1 reject."; exit 1; fi

    echo "  -> 事前準備 (フレンド関係の構築) 完了"

    # バルククエリー実行
    IDS_REL="${U1_ID},${U2_ID},${U3_ID},${U4_ID},${U5_ID},${U6_ID},${U7_ID}"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" -X GET "$BASE_URL/user-profile/profiles?ids=$IDS_REL" \
        -H "Authorization: Bearer $U1_TOKEN")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")

    echo "  -> HTTP Status: $HTTP_STATUS (Expected: 200)"
    echo "  -> Success: $SUCCESS (Expected: true)"

    # 各ユーザーのステータスを取得
    S_U1=$(jq -r ".data.profileMap[\"$U1_ID\"].relationship.status" "$TEMP_RES")
    S_U2=$(jq -r ".data.profileMap[\"$U2_ID\"].relationship.status" "$TEMP_RES")
    S_U3=$(jq -r ".data.profileMap[\"$U3_ID\"].relationship.status" "$TEMP_RES")
    S_U4=$(jq -r ".data.profileMap[\"$U4_ID\"].relationship.status" "$TEMP_RES")
    S_U5=$(jq -r ".data.profileMap[\"$U5_ID\"].relationship.status" "$TEMP_RES")
    S_U6=$(jq -r ".data.profileMap[\"$U6_ID\"].relationship.status" "$TEMP_RES")
    S_U7=$(jq -r ".data.profileMap[\"$U7_ID\"].relationship.status" "$TEMP_RES")

    echo "  -> User1 (Self)       : $S_U1 (Expected: SELF)"
    echo "  -> User2 (Incoming)   : $S_U2 (Expected: PENDING_INCOMING)"
    echo "  -> User3 (Outgoing)   : $S_U3 (Expected: PENDING_OUTGOING)"
    echo "  -> User4 (Friend)     : $S_U4 (Expected: FRIEND)"
    echo "  -> User5 (Blocked By) : $S_U5 (Expected: BLOCKED_BY)"
    echo "  -> User6 (Blocked)    : $S_U6 (Expected: BLOCKED)"
    echo "  -> User7 (None)       : $S_U7 (Expected: NONE)"

    # アサーション
    if [ "$HTTP_STATUS" -eq 200 ] && [ "$SUCCESS" = "true" ] && \
       [ "$S_U1" = "SELF" ] && \
       [ "$S_U2" = "PENDING_INCOMING" ] && \
       [ "$S_U3" = "PENDING_OUTGOING" ] && \
       [ "$S_U4" = "FRIEND" ] && \
       [ "$S_U5" = "BLOCKED_BY" ] && \
       [ "$S_U6" = "BLOCKED" ] && \
       [ "$S_U7" = "NONE" ]; then
        echo "  => [PASS] テスト4 成功"
    else
        echo "  => [FAIL] テスト4 失敗"
        cat "$TEMP_RES"
    fi
    echo ""

    # 一時ファイルの削除
    rm -f "$TEMP_RES"
}

# 3. 後処理 (ログアウト ＆ ユーザー削除)
cleanup() {
    load_state
    echo "=== 【後処理】全 $TOTAL_USERS ユーザーのログアウト ＆ アカウント削除 ==="

    for i in "${!USER_IDS[@]}"; do
        id="${USER_IDS[$i]}"
        token="${USER_TOKENS[$i]}"
        refresh="${USER_REFRESH[$i]}"
        user_num=$((i + 1))

        if [ $((user_num % 10)) -eq 0 ] || [ $user_num -eq 1 ] || [ $user_num -eq $TOTAL_USERS ]; then
            echo "Cleaning up User $user_num / $TOTAL_USERS ..."
        fi

        # ログアウト
        curl -s -o /dev/null -X POST "$BASE_URL/auth/sign-out" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            -d "{\"refreshToken\":\"$refresh\"}"

        # ユーザー削除
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL/users/$id" \
            -H "Authorization: Bearer $token")

        if [ "$HTTP_STATUS" -ne 204 ] && [ "$HTTP_STATUS" -ne 200 ]; then
            echo "  -> [Warning] Failed to delete User $user_num (ID: $id). HTTP Status: $HTTP_STATUS"
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
        echo "  setup   : 準備（101アカウントの作成とトークン取得）"
        echo "  test    : テスト実行（上限超過エラーや取得結果の整合性確認）"
        echo "  cleanup : 後処理（ログアウトと101アカウントの削除）"
        echo "  all     : setup -> test -> cleanup を一括で実行"
        exit 1
        ;;
esac
