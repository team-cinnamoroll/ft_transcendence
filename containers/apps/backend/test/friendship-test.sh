#!/bin/bash

# ==========================================
# 設定・変数定義
# ==========================================
BASE_URL=${BASE_URL:-"http://localhost:8000/api/v1"}
STATE_FILE=".test_state_friendships"
TOTAL_USERS=101

API_KEY=${MASTER_API_KEY:-"tracen_master_api_key"}  # APIキー（必要に応じて変更）

# ==========================================
# ヘルパー関数
# ==========================================
# jqコマンドの存在チェック
if ! command -v jq &> /dev/null; then
    echo "Error: jq がインストールされていません。インストールしてから再実行してください。"
    exit 1
fi

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

# HTTPリクエストのラッパー
# 実行後、グローバル変数 G_STATUS にHTTPステータスコード、G_BODY にレスポンスボディが格納されます
request() {
    local method="$1"
    local path="$2"
    local token="$3"
    local body="$4"

    local url="${BASE_URL}${path}"
    local headers=("-H" "Authorization: Bearer $token")
    if [ -n "$body" ]; then
        headers+=("-H" "Content-Type: application/json" "-d" "$body")
    fi

    local res
    res=$(curl -s -w "\n%{http_code}" -X "$method" "$url" "${headers[@]}")

    G_STATUS=$(echo "$res" | tail -n1)
    G_BODY=$(echo "$res" | sed '$d')
}

# 検証用関数
assert_eq() {
    local actual="$1"
    local expected="$2"
    local msg="$3"
    if [ "$actual" != "$expected" ]; then
        echo "  => [FAIL] $msg"
        echo "     Expected: $expected, Actual: $actual"
        echo "     Response Body: $G_BODY"
        exit 1
    fi
}

# ==========================================
# 1. 準備 (サインアップ)
# ==========================================
setup() {
    echo "=== 【準備】 $TOTAL_USERS 件のユーザーサインアップ ==="
    rm -f "$STATE_FILE"

    for i in $(seq 1 $TOTAL_USERS); do
        email="testuser_${i}_$(date +%s)@example.com"
        name="Test User $i"
        pass="password1234"

        if [ $((i % 10)) -eq 0 ] || [ $i -eq 1 ] || [ $i -eq $TOTAL_USERS ]; then
            echo "Signing up User $i / $TOTAL_USERS ..."
        fi

        RES=$(curl -s -X POST "$BASE_URL/auth/sign-up" \
            -H "Content-Type: application/json" \
            -H "X-API-Key: $API_KEY" \
            -d "{\"email\":\"$email\",\"name\":\"$name\",\"password\":\"$pass\"}")

        SUCCESS=$(echo "$RES" | jq -r '.success')
        if [ "$SUCCESS" != "true" ]; then
            echo "Failed to sign up User $i. Response: $RES"
            exit 1
        fi

        id=$(echo "$RES" | jq -r '.data.user.id')
        token=$(echo "$RES" | jq -r '.data.accessToken')
        refresh=$(echo "$RES" | jq -r '.data.refreshToken')

        echo "$id $token $refresh" >> "$STATE_FILE"
    done

    echo "=> 準備完了。状態を $STATE_FILE に保存しました。"
    echo ""
}

# ==========================================
# 2. テスト実行
# ==========================================
run_tests() {
    load_state
    echo "=== 【テスト実行】 フレンドAPIの確認 ==="

    local U_A_ID="${USER_IDS[0]}"
    local U_A_TOKEN="${USER_TOKENS[0]}"
    local U_B_ID="${USER_IDS[1]}"
    local U_B_TOKEN="${USER_TOKENS[1]}"

    # ----------------------------------------------------
    # ２件のアカウントを使用してテスト
    # ----------------------------------------------------
    echo "--- [1] 2件のアカウントを使用したテスト ---"

    echo "  > 取り消しテスト"
    request POST "/friendships/requests" "$U_A_TOKEN" "{\"addresseeId\":\"$U_B_ID\"}"
    assert_eq "$G_STATUS" "201" "A->B 申請ステータス"
    assert_eq "$(echo "$G_BODY" | jq -r '.success')" "true" "A->B 申請 success"
    assert_eq "$(echo "$G_BODY" | jq -r '.data.friendship.status')" "PENDING" "A->B 申請 status=PENDING"
    F_ID=$(echo "$G_BODY" | jq -r '.data.friendship.id')

    request POST "/friendships/requests" "$U_A_TOKEN" "{\"addresseeId\":\"$U_B_ID\"}"
    assert_eq "$G_STATUS" "409" "A->B 再申請ステータス"
    assert_eq "$(echo "$G_BODY" | jq -r '.success')" "false" "A->B 再申請 success"

    request DELETE "/friendships/requests/$F_ID" "$U_A_TOKEN" ""
    assert_eq "$G_STATUS" "200" "A->B 取り消しステータス"
    assert_eq "$(echo "$G_BODY" | jq -r '.success')" "true" "A->B 取り消し success"
    assert_eq "$(echo "$G_BODY" | jq -r '.data.friendship')" "null" "A->B 取り消し friendship=null"

    request DELETE "/friendships/requests/$F_ID" "$U_A_TOKEN" ""
    assert_eq "$G_STATUS" "404" "A->B 再取り消しステータス"
    assert_eq "$(echo "$G_BODY" | jq -r '.success')" "false" "A->B 再取り消し success"


    echo "  > 拒否テスト"
    request POST "/friendships/requests" "$U_A_TOKEN" "{\"addresseeId\":\"$U_B_ID\"}"
    assert_eq "$G_STATUS" "201" "A->B 申請ステータス"
    assert_eq "$(echo "$G_BODY" | jq -r '.data.friendship.status')" "PENDING" "status=PENDING"
    F_ID=$(echo "$G_BODY" | jq -r '.data.friendship.id')

    request DELETE "/friendships/requests/$F_ID" "$U_B_TOKEN" ""
    assert_eq "$G_STATUS" "200" "B拒否ステータス"
    assert_eq "$(echo "$G_BODY" | jq -r '.success')" "true" "B拒否 success"
    assert_eq "$(echo "$G_BODY" | jq -r '.data.friendship.status')" "BLOCKED" "status=BLOCKED"

    request DELETE "/friendships/requests/$F_ID" "$U_B_TOKEN" ""
    assert_eq "$G_STATUS" "200" "B再拒否ステータス"
    assert_eq "$(echo "$G_BODY" | jq -r '.success')" "true" "B再拒否 success"
    assert_eq "$(echo "$G_BODY" | jq -r '.data.friendship')" "null" "friendship=null"

    request DELETE "/friendships/requests/$F_ID" "$U_B_TOKEN" ""
    assert_eq "$G_STATUS" "404" "B再々拒否ステータス"
    assert_eq "$(echo "$G_BODY" | jq -r '.success')" "false" "B再々拒否 success"


    echo "  > 承認と解消テスト"
    request GET "/friendships?limit=100" "$U_A_TOKEN" ""
    assert_eq "$G_STATUS" "200" "Aフレンド一覧"
    assert_eq "$(echo "$G_BODY" | jq -r '.data.friendships | length')" "0" "Aフレンド一覧 空"
    request GET "/friendships?limit=100" "$U_B_TOKEN" ""
    assert_eq "$G_STATUS" "200" "Bフレンド一覧"
    assert_eq "$(echo "$G_BODY" | jq -r '.data.friendships | length')" "0" "Bフレンド一覧 空"

    request POST "/friendships/requests" "$U_A_TOKEN" "{\"addresseeId\":\"$U_B_ID\"}"
    assert_eq "$G_STATUS" "201" "A->B申請"
    assert_eq "$(echo "$G_BODY" | jq -r '.data.friendship.status')" "PENDING" "status=PENDING"
    F_ID=$(echo "$G_BODY" | jq -r '.data.friendship.id')

    request GET "/friendships/requests?type=incoming&limit=100" "$U_A_TOKEN" ""
    assert_eq "$G_STATUS" "200" "A受信一覧"
    assert_eq "$(echo "$G_BODY" | jq -r '.data.pendingRequests | length')" "0" "A受信一覧 空"

    request GET "/friendships/requests?type=incoming&limit=100" "$U_B_TOKEN" ""
    assert_eq "$G_STATUS" "200" "B受信一覧"
    assert_eq "$(echo "$G_BODY" | jq -r '.data.pendingRequests | length')" "1" "B受信一覧 1件"
    assert_eq "$(echo "$G_BODY" | jq -r '.data.pendingRequests[0].requestId')" "$F_ID" "B受信一覧 requestId一致"

    request GET "/friendships/requests?type=outgoing&limit=100" "$U_A_TOKEN" ""
    assert_eq "$G_STATUS" "200" "A送信一覧"
    assert_eq "$(echo "$G_BODY" | jq -r '.data.pendingRequests | length')" "1" "A送信一覧 1件"
    assert_eq "$(echo "$G_BODY" | jq -r '.data.pendingRequests[0].requestId')" "$F_ID" "A送信一覧 requestId一致"

    request GET "/friendships/requests?type=outgoing&limit=100" "$U_B_TOKEN" ""
    assert_eq "$G_STATUS" "200" "B送信一覧"
    assert_eq "$(echo "$G_BODY" | jq -r '.data.pendingRequests | length')" "0" "B送信一覧 空"

    request PATCH "/friendships/requests/$F_ID/accept" "$U_B_TOKEN" ""
    assert_eq "$G_STATUS" "200" "B承認"
    assert_eq "$(echo "$G_BODY" | jq -r '.success')" "true" "B承認 success"
    assert_eq "$(echo "$G_BODY" | jq -r '.data.friendship.status')" "ACCEPTED" "status=ACCEPTED"

    request PATCH "/friendships/requests/$F_ID/accept" "$U_B_TOKEN" ""
    assert_eq "$G_STATUS" "409" "B再承認"
    assert_eq "$(echo "$G_BODY" | jq -r '.success')" "false" "B再承認 success=false"

    request GET "/friendships?limit=100" "$U_A_TOKEN" ""
    assert_eq "$(echo "$G_BODY" | jq -r '.data.friendships | length')" "1" "Aフレンド一覧 1件"
    assert_eq "$(echo "$G_BODY" | jq -r '.data.friendships[0].friendshipId')" "$F_ID" "Aフレンド一覧 friendshipId一致"

    request GET "/friendships?limit=100" "$U_B_TOKEN" ""
    assert_eq "$(echo "$G_BODY" | jq -r '.data.friendships | length')" "1" "Bフレンド一覧 1件"
    assert_eq "$(echo "$G_BODY" | jq -r '.data.friendships[0].friendshipId')" "$F_ID" "Bフレンド一覧 friendshipId一致"

    request DELETE "/friendships/$U_B_ID" "$U_A_TOKEN" ""
    assert_eq "$G_STATUS" "204" "Aからのフレンド解消"

    request GET "/friendships?limit=100" "$U_A_TOKEN" ""
    assert_eq "$(echo "$G_BODY" | jq -r '.data.friendships | length')" "0" "Aフレンド一覧 空"
    request GET "/friendships?limit=100" "$U_B_TOKEN" ""
    assert_eq "$(echo "$G_BODY" | jq -r '.data.friendships | length')" "0" "Bフレンド一覧 空"

    # 再構築＆Bからの解消
    request POST "/friendships/requests" "$U_A_TOKEN" "{\"addresseeId\":\"$U_B_ID\"}"
    F_ID_2=$(echo "$G_BODY" | jq -r '.data.friendship.id')
    request PATCH "/friendships/requests/$F_ID_2/accept" "$U_B_TOKEN" ""
    assert_eq "$G_STATUS" "200" "B再構築時承認"

    request GET "/friendships?limit=100" "$U_A_TOKEN" ""
    assert_eq "$(echo "$G_BODY" | jq -r '.data.friendships[0].friendshipId')" "$F_ID_2" "Aフレンド一覧 再構築id"
    request GET "/friendships?limit=100" "$U_B_TOKEN" ""
    assert_eq "$(echo "$G_BODY" | jq -r '.data.friendships[0].friendshipId')" "$F_ID_2" "Bフレンド一覧 再構築id"

    request DELETE "/friendships/$U_A_ID" "$U_B_TOKEN" ""
    assert_eq "$G_STATUS" "204" "Bからのフレンド解消"

    request GET "/friendships?limit=100" "$U_A_TOKEN" ""
    assert_eq "$(echo "$G_BODY" | jq -r '.data.friendships | length')" "0" "Aフレンド一覧 空"
    request GET "/friendships?limit=100" "$U_B_TOKEN" ""
    assert_eq "$(echo "$G_BODY" | jq -r '.data.friendships | length')" "0" "Bフレンド一覧 空"


    # ----------------------------------------------------
    # 101件のアカウントを使用してテスト
    # ----------------------------------------------------
    echo ""
    echo "--- [2] 101件のアカウントを使用したテスト ---"

    # 共通変数
    local req_ids=()
    local fetched_ids=()
    local cursor=""
    local false_count=0
    local true_count=0

    echo "  > 1つのアカウントが100件のアカウントにフレンド申請"
    req_ids=()
    for i in {1..100}; do
        request POST "/friendships/requests" "$U_A_TOKEN" "{\"addresseeId\":\"${USER_IDS[$i]}\"}"
        if [ "$G_STATUS" != "201" ]; then
            echo "Failed 1->100 requests loop at index $i. Expected: 201, Actual: $G_STATUS"
            exit 1
        fi
        req_ids+=("$(echo "$G_BODY" | jq -r '.data.friendship.id')")
    done
    echo "    - 100件申請完了"

    request GET "/friendships/requests?type=outgoing&limit=0" "$U_A_TOKEN" ""
    assert_eq "$G_STATUS" "400" "送信一覧 limit=0"
    request GET "/friendships/requests?type=outgoing&limit=101" "$U_A_TOKEN" ""
    assert_eq "$G_STATUS" "400" "送信一覧 limit=101"

    fetched_ids=()
    cursor=""
    while true; do
        path="/friendships/requests?type=outgoing&limit=20"
        if [ -n "$cursor" ] && [ "$cursor" != "null" ]; then path="${path}&cursor=${cursor}"; fi
        request GET "$path" "$U_A_TOKEN" ""
        assert_eq "$G_STATUS" "200" "送信一覧ページネーション取得"

        while read -r rid; do
            if [ -n "$rid" ]; then fetched_ids+=("$rid"); fi
        done < <(echo "$G_BODY" | jq -r '.data.pendingRequests[].requestId')

        cursor=$(echo "$G_BODY" | jq -r '.data.nextCursor')
        if [ "$cursor" = "null" ] || [ -z "$cursor" ]; then break; fi
    done

    assert_eq "${#fetched_ids[@]}" "100" "送信一覧 全100件取得確認"
    assert_eq "$(printf "%s\n" "${fetched_ids[@]}" | sort -u | wc -l | tr -d ' ')" "100" "送信一覧 全ユニーク確認"

    # 100件承認 (Others -> A)
    for i in {1..100}; do
        request PATCH "/friendships/requests/${req_ids[$((i-1))]}/accept" "${USER_TOKENS[$i]}" ""
        if [ "$G_STATUS" != "200" ]; then echo "Failed accept loop at $i"; exit 1; fi
    done
    echo "    - 100件承認完了"

    request GET "/friendships?limit=0" "$U_A_TOKEN" ""
    assert_eq "$G_STATUS" "400" "フレンド一覧 limit=0"
    request GET "/friendships?limit=101" "$U_A_TOKEN" ""
    assert_eq "$G_STATUS" "400" "フレンド一覧 limit=101"

    fetched_ids=()
    cursor=""
    while true; do
        path="/friendships?limit=20"
        if [ -n "$cursor" ] && [ "$cursor" != "null" ]; then path="${path}&cursor=${cursor}"; fi
        request GET "$path" "$U_A_TOKEN" ""
        assert_eq "$G_STATUS" "200" "フレンド一覧ページネーション取得"

        while read -r rid; do
            if [ -n "$rid" ]; then fetched_ids+=("$rid"); fi
        done < <(echo "$G_BODY" | jq -r '.data.friendships[].friendshipId')

        cursor=$(echo "$G_BODY" | jq -r '.data.nextCursor')
        if [ "$cursor" = "null" ] || [ -z "$cursor" ]; then break; fi
    done
    assert_eq "${#fetched_ids[@]}" "100" "フレンド一覧 全100件取得確認"
    assert_eq "$(printf "%s\n" "${fetched_ids[@]}" | sort -u | wc -l | tr -d ' ')" "100" "フレンド一覧 全ユニーク確認"

    # 100件解消
    for i in {1..100}; do
        request DELETE "/friendships/${USER_IDS[$i]}" "$U_A_TOKEN" ""
        if [ "$G_STATUS" != "204" ]; then echo "Failed delete loop at $i"; exit 1; fi
    done
    echo "    - 100件解消完了"


    echo "  > 1つのアカウントに対して100件のアカウントからフレンド申請を受ける"
    req_ids=()
    for i in {1..100}; do
        request POST "/friendships/requests" "${USER_TOKENS[$i]}" "{\"addresseeId\":\"$U_A_ID\"}"
        if [ "$G_STATUS" != "201" ]; then echo "Failed 100->1 requests loop at $i"; exit 1; fi
        req_ids+=("$(echo "$G_BODY" | jq -r '.data.friendship.id')")
    done
    echo "    - 100件受信完了"

    request GET "/friendships/requests?type=incoming&limit=0" "$U_A_TOKEN" ""
    assert_eq "$G_STATUS" "400" "受信一覧 limit=0"
    request GET "/friendships/requests?type=incoming&limit=101" "$U_A_TOKEN" ""
    assert_eq "$G_STATUS" "400" "受信一覧 limit=101"

    fetched_ids=()
    cursor=""
    while true; do
        path="/friendships/requests?type=incoming&limit=20"
        if [ -n "$cursor" ] && [ "$cursor" != "null" ]; then path="${path}&cursor=${cursor}"; fi
        request GET "$path" "$U_A_TOKEN" ""
        assert_eq "$G_STATUS" "200" "受信一覧ページネーション取得"

        while read -r rid; do
            if [ -n "$rid" ]; then fetched_ids+=("$rid"); fi
        done < <(echo "$G_BODY" | jq -r '.data.pendingRequests[].requestId')

        cursor=$(echo "$G_BODY" | jq -r '.data.nextCursor')
        if [ "$cursor" = "null" ] || [ -z "$cursor" ]; then break; fi
    done
    assert_eq "${#fetched_ids[@]}" "100" "受信一覧 全100件取得確認"
    assert_eq "$(printf "%s\n" "${fetched_ids[@]}" | sort -u | wc -l | tr -d ' ')" "100" "受信一覧 全ユニーク確認"

    # U_A が 100件すべて承認
    for i in {1..100}; do
        request PATCH "/friendships/requests/${req_ids[$((i-1))]}/accept" "$U_A_TOKEN" ""
        if [ "$G_STATUS" != "200" ]; then echo "Failed A accept loop at $i"; exit 1; fi
    done
    echo "    - Aによる100件承認完了"

    request GET "/friendships?limit=0" "$U_A_TOKEN" ""
    assert_eq "$G_STATUS" "400" "フレンド一覧 limit=0"
    request GET "/friendships?limit=101" "$U_A_TOKEN" ""
    assert_eq "$G_STATUS" "400" "フレンド一覧 limit=101"

    fetched_ids=()
    cursor=""
    false_count=0
    while true; do
        path="/friendships?limit=20"
        if [ -n "$cursor" ] && [ "$cursor" != "null" ]; then path="${path}&cursor=${cursor}"; fi
        request GET "$path" "$U_A_TOKEN" ""
        assert_eq "$G_STATUS" "200" "フレンド一覧ページネーション取得"

        # IDとisOnlineの情報を取得してカウント
        while read -r rid is_online; do
            if [ -n "$rid" ]; then
                fetched_ids+=("$rid")
                if [ "$is_online" = "false" ]; then
                    false_count=$((false_count + 1))
                fi
            fi
        done < <(echo "$G_BODY" | jq -r '.data.friendships[] | "\(.friendshipId) \(.isOnline)"')

        cursor=$(echo "$G_BODY" | jq -r '.data.nextCursor')
        if [ "$cursor" = "null" ] || [ -z "$cursor" ]; then break; fi
    done
    assert_eq "${#fetched_ids[@]}" "100" "フレンド一覧 全100件取得確認"
    assert_eq "$(printf "%s\n" "${fetched_ids[@]}" | sort -u | wc -l | tr -d ' ')" "100" "フレンド一覧 全ユニーク確認"
    assert_eq "$false_count" "100" "フレンド一覧 全てのisOnlineがfalseであること"

    # ----------------------------------------------------
    # ハートビートとオンライン状態の検証
    # ----------------------------------------------------
    echo "  > 100件中50件をオンラインにする"

    # U_A (USER_IDS[0]) のフレンドは USER_IDS[1] 〜 USER_IDS[100]
    # そのうち半分の50件（インデックス 1 〜 50）をオンライン状態にする
    for i in {1..50}; do
        request POST "/presence/heartbeat" "${USER_TOKENS[$i]}" "{}"
        if [ "$G_STATUS" != "200" ]; then
            echo "Failed heartbeat at user index $i. Expected: 200, Actual: $G_STATUS"
            exit 1
        fi
        assert_eq "$(echo "$G_BODY" | jq -r '.success')" "true" "heartbeat success (User $i)"
    done
    echo "    - 50件のハートビート実行完了"

    request GET "/friendships?limit=100" "$U_A_TOKEN" ""
    assert_eq "$G_STATUS" "200" "フレンド一覧一括取得ステータス (limit=100)"
    assert_eq "$(echo "$G_BODY" | jq -r '.success')" "true" "フレンド一覧一括取得 success (limit=100)"

    # isOnline の true / false の数をカウント
    true_count=$(echo "$G_BODY" | jq -r '[.data.friendships[] | select(.isOnline == true)] | length')
    false_count=$(echo "$G_BODY" | jq -r '[.data.friendships[] | select(.isOnline == false)] | length')

    assert_eq "$true_count" "50" "50件がisOnline=trueであること"
    assert_eq "$false_count" "50" "50件がisOnline=falseであること"


    echo ""
    echo "=> [PASS] 全てのテストが正常に完了しました！"
    echo ""
}

# ==========================================
# 3. 後処理 (ログアウト ＆ ユーザー削除) ※同一内容
# ==========================================
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

        curl -s -o /dev/null -X POST "$BASE_URL/auth/sign-out" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            -d "{\"refreshToken\":\"$refresh\"}"

        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL/users/$id" \
            -H "Authorization: Bearer $token")

        if [ "$HTTP_STATUS" -ne 204 ] && [ "$HTTP_STATUS" -ne 200 ]; then
            echo "  -> [Warning] Failed to delete User $user_num (ID: $id). HTTP Status: $HTTP_STATUS"
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
        echo "  test    : テスト実行（フレンドAPIの網羅的テスト）"
        echo "  cleanup : 後処理（ログアウトと101アカウントの削除）"
        echo "  all     : setup -> test -> cleanup を一括で実行"
        exit 1
        ;;
esac


