#!/bin/bash

# ==========================================
# 設定・変数定義
# ==========================================
BASE_URL=${BASE_URL:-"http://localhost:8000/api/v1"}

API_KEY=${MASTER_API_KEY:-"tracen_master_api_key"}  # APIキー（必要に応じて変更）

STATE_FILE="/tmp/.face_seed_test_state"
TEMP_RES="/tmp/temp_face_seed_res.json"
TEST_IMAGE="/tmp/face_seed_test_image.jpg"

# テスト用ユーザーデータ（2ユーザーで所有権テストを行う）
USER1_EMAIL="face_seed_u1_$(date +%s)@example.com"
USER1_NAME="FaceSeed User1"
USER1_PASS="password1234"

USER2_EMAIL="face_seed_u2_$(date +%s)@example.com"
USER2_NAME="FaceSeed User2"
USER2_PASS="password1234"

# テスト結果の集計
PASS_COUNT=0
FAIL_COUNT=0

# ==========================================
# ヘルパー関数
# ==========================================
for cmd in jq curl; do
    if ! command -v $cmd &> /dev/null; then
        echo "Error: $cmd がインストールされていません。"
        exit 1
    fi
done

# UUIDv4 生成
generate_uuid() {
    if command -v uuidgen > /dev/null 2>&1; then
        uuidgen | tr 'A-Z' 'a-z'
    elif [ -f /proc/sys/kernel/random/uuid ]; then
        cat /proc/sys/kernel/random/uuid
    else
        echo "12345678-1234-4000-8000-$(printf "%012x" $RANDOM$RANDOM)"
    fi
}

# アサーション関数
assert() {
    local test_name="$1"
    local expected_status="$2"
    local actual_status="$3"
    local expected_success="$4"
    local actual_success="$5"
    local extra_check="${6:-true}"   # 追加条件（省略時は常にtrue）
    local extra_label="${7:-""}"

    local ok=true
    if [ "$actual_status" -ne "$expected_status" ]; then ok=false; fi
    if [ "$actual_success" != "$expected_success" ]; then ok=false; fi
    if [ "$extra_check" != "true" ]; then ok=false; fi

    if [ "$ok" = "true" ]; then
        echo "  => [PASS] $test_name"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo "  => [FAIL] $test_name"
        echo "     HTTP Status : $actual_status (Expected: $expected_status)"
        echo "     success     : $actual_success (Expected: $expected_success)"
        if [ -n "$extra_label" ]; then
            echo "     Extra Check : $extra_check (Expected: true) — $extra_label"
        fi
        cat "$TEMP_RES" 2>/dev/null
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
    echo ""
}

# 状態保存
save_state() {
    cat <<EOF > "$STATE_FILE"
U1_ID="$U1_ID"
U1_TOKEN="$U1_TOKEN"
U1_REFRESH="$U1_REFRESH"
U2_ID="$U2_ID"
U2_TOKEN="$U2_TOKEN"
U2_REFRESH="$U2_REFRESH"
IMAGE1_ID="$IMAGE1_ID"
IMAGE2_ID="$IMAGE2_ID"
EOF
}

# 状態読み込み
load_state() {
    if [ ! -f "$STATE_FILE" ]; then
        echo "Error: 状態ファイル ($STATE_FILE) が見つかりません。先に 'setup' を実行してください。"
        exit 1
    fi
    source "$STATE_FILE"
}

# ==========================================
# 1. 準備（ユーザー作成 + 画像アップロード）
# ==========================================
setup() {
    echo "=== 【準備】ユーザー作成 & 画像アップロード ==="

    # ダミー画像生成
    echo "Generating dummy image ($TEST_IMAGE)..."
    dd if=/dev/urandom of="$TEST_IMAGE" bs=1k count=100 2>/dev/null

    # --- User1 作成 ---
    echo "Signing up User1 ($USER1_EMAIL)..."
    RES=$(curl -s -X POST "$BASE_URL/auth/sign-up" \
        -H "X-API-Key: $API_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$USER1_EMAIL\",\"name\":\"$USER1_NAME\",\"password\":\"$USER1_PASS\"}")
    if [ "$(echo "$RES" | jq -r '.success')" != "true" ]; then
        echo "Failed to sign up User1: $RES"; exit 1
    fi
    U1_ID=$(echo "$RES" | jq -r '.data.user.id')
    U1_TOKEN=$(echo "$RES" | jq -r '.data.accessToken')
    U1_REFRESH=$(echo "$RES" | jq -r '.data.refreshToken')
    echo "  -> User1 ID: $U1_ID"

    # --- User2 作成 ---
    echo "Signing up User2 ($USER2_EMAIL)..."
    RES=$(curl -s -X POST "$BASE_URL/auth/sign-up" \
        -H "X-API-Key: $API_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$USER2_EMAIL\",\"name\":\"$USER2_NAME\",\"password\":\"$USER2_PASS\"}")
    if [ "$(echo "$RES" | jq -r '.success')" != "true" ]; then
        echo "Failed to sign up User2: $RES"; exit 1
    fi
    U2_ID=$(echo "$RES" | jq -r '.data.user.id')
    U2_TOKEN=$(echo "$RES" | jq -r '.data.accessToken')
    U2_REFRESH=$(echo "$RES" | jq -r '.data.refreshToken')
    echo "  -> User2 ID: $U2_ID"

    # --- User1 で画像1をアップロード ---
    echo "Uploading Image1 for User1..."
    FILE_SIZE=$(wc -c < "$TEST_IMAGE" | tr -d ' ')
    RES=$(curl -s -X POST "$BASE_URL/file-storage/upload" \
        -H "Authorization: Bearer $U1_TOKEN" \
        -H "x-file-name: test_image1.jpg" \
        -H "x-file-type: image/jpeg" \
        -H "content-length: $FILE_SIZE" \
        -H "x-visibility: public" \
        --data-binary @"$TEST_IMAGE")
    if [ "$(echo "$RES" | jq -r '.success')" != "true" ]; then
        echo "Failed to upload Image1: $RES"; exit 1
    fi
    IMAGE1_ID=$(echo "$RES" | jq -r '.data.fileId')
    echo "  -> Image1 ID: $IMAGE1_ID"

    # --- User1 で画像2をアップロード ---
    echo "Uploading Image2 for User1..."
    RES=$(curl -s -X POST "$BASE_URL/file-storage/upload" \
        -H "Authorization: Bearer $U1_TOKEN" \
        -H "x-file-name: test_image2.jpg" \
        -H "x-file-type: image/jpeg" \
        -H "content-length: $FILE_SIZE" \
        -H "x-visibility: public" \
        --data-binary @"$TEST_IMAGE")
    if [ "$(echo "$RES" | jq -r '.success')" != "true" ]; then
        echo "Failed to upload Image2: $RES"; exit 1
    fi
    IMAGE2_ID=$(echo "$RES" | jq -r '.data.fileId')
    echo "  -> Image2 ID: $IMAGE2_ID"

    save_state
    echo "=> 準備完了。状態を $STATE_FILE に保存しました。"
    echo ""
}

# ==========================================
# 2. Face API テスト
# ==========================================
run_face_tests() {
    load_state
    echo "=== 【テスト実行】Face API ==="

    # ----------------------------------------------------------------
    # POST /faces — Face 作成
    # ----------------------------------------------------------------
    echo "--- [Face] POST /faces ---"

    # [1] 画像・絵文字・説明なしで最小限の Face 作成（User1）
    echo "[F-1] 最小構成（名前のみ）で Face を作成"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" -X POST "$BASE_URL/faces" \
        -H "Authorization: Bearer $U1_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"MyFace No Extras\",\"emoji\":null,\"description\":null,\"imageId\":null,\"visibility\":\"public\"}")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    FACE1_ID=$(jq -r '.data.face.id' "$TEMP_RES")
    NAME_CHECK=$(jq -r '.data.face.name' "$TEMP_RES")
    OWNER_CHECK=$(jq -r ".data.face.userId" "$TEMP_RES")
    assert "F-1: 最小構成 Face 作成 (201)" 201 "$HTTP_STATUS" "true" "$SUCCESS" \
        "$([ "$NAME_CHECK" = "MyFace No Extras" ] && [ "$OWNER_CHECK" = "$U1_ID" ] && echo true || echo false)" \
        "name・userId が正しいか"

    # [2] 全フィールドあり（絵文字・説明・画像・private）
    echo "[F-2] 全フィールドあり（画像・絵文字・説明・private）で Face 作成"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" -X POST "$BASE_URL/faces" \
        -H "Authorization: Bearer $U1_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"MyFace Full\",\"emoji\":\"🎉\",\"description\":\"Full Face Description\",\"imageId\":\"$IMAGE1_ID\",\"visibility\":\"private\"}")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    FACE2_ID=$(jq -r '.data.face.id' "$TEMP_RES")
    EMOJI_CHECK=$(jq -r '.data.face.emoji' "$TEMP_RES")
    VIS_CHECK=$(jq -r '.data.face.visibility' "$TEMP_RES")
    assert "F-2: 全フィールドあり Face 作成 (201)" 201 "$HTTP_STATUS" "true" "$SUCCESS" \
        "$([ "$EMOJI_CHECK" = "🎉" ] && [ "$VIS_CHECK" = "private" ] && echo true || echo false)" \
        "emoji・visibility が正しいか"

    # [3] User2 で別の Face を作成（後の所有権テスト用）
    echo "[F-3] User2 で Face を作成（所有権テスト用）"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" -X POST "$BASE_URL/faces" \
        -H "Authorization: Bearer $U2_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"User2 Face\",\"emoji\":null,\"description\":null,\"imageId\":null,\"visibility\":\"public\"}")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    U2_FACE_ID=$(jq -r '.data.face.id' "$TEMP_RES")
    assert "F-3: User2 Face 作成 (201)" 201 "$HTTP_STATUS" "true" "$SUCCESS"

    # [4] 名前なし（バリデーションエラー）
    echo "[F-4] 名前なし → バリデーションエラー (400)"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" -X POST "$BASE_URL/faces" \
        -H "Authorization: Bearer $U1_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"\",\"emoji\":null,\"description\":null,\"imageId\":null,\"visibility\":\"public\"}")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    assert "F-4: 名前なしバリデーションエラー (400)" 400 "$HTTP_STATUS" "false" "$SUCCESS"

    # [5] 認証なし (401)
    echo "[F-5] 認証なし → 401"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" -X POST "$BASE_URL/faces" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"NoAuth Face\",\"emoji\":null,\"description\":null,\"imageId\":null,\"visibility\":\"public\"}")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    assert "F-5: 認証なし (401)" 401 "$HTTP_STATUS" "false" "$SUCCESS"

    # ----------------------------------------------------------------
    # PUT /faces/:faceId — Face 更新
    # ----------------------------------------------------------------
    echo "--- [Face] PUT /faces/:faceId ---"

    # [6] 自分の Face を正常に更新（画像を追加）
    echo "[F-6] 自分の Face を更新（画像追加）"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" -X PUT "$BASE_URL/faces/$FACE1_ID" \
        -H "Authorization: Bearer $U1_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"Updated Face\",\"emoji\":\"🚀\",\"description\":\"Updated Desc\",\"imageId\":\"$IMAGE1_ID\"}")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    UPDATED_FACE_ID=$(jq -r '.data.face.id' "$TEMP_RES")
    UPDATED_NAME=$(jq -r '.data.face.name' "$TEMP_RES")
    UPDATED_EMOJI=$(jq -r '.data.face.emoji' "$TEMP_RES")
    UPDATED_DESC=$(jq -r '.data.face.description' "$TEMP_RES")
    UPDATED_IMAGE_ID=$(jq -r '.data.face.image.id' "$TEMP_RES")
    UPDATED_VIS=$(jq -r '.data.face.visibility' "$TEMP_RES")
    assert "F-6: 自分の Face 更新 (200)" 200 "$HTTP_STATUS" "true" "$SUCCESS" \
        "$([ "$UPDATED_FACE_ID" = "$FACE1_ID" ] && [ "$UPDATED_NAME" = "Updated Face" ] && [ "$UPDATED_EMOJI" = "🚀" ] && [ "$UPDATED_DESC" = "Updated Desc" ] && [ "$UPDATED_IMAGE_ID" = "$IMAGE1_ID" ] && [ "$UPDATED_VIS" = "public" ] && echo true || echo false)" \
        "更新内容が正しく反映されているか"

    # [7] 自分の Face を更新（画像を削除 → imageId: null）
    echo "[F-7] 自分の Face を更新（画像削除 imageId=null）"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" -X PUT "$BASE_URL/faces/$FACE1_ID" \
        -H "Authorization: Bearer $U1_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"Updated Face No Image\",\"emoji\":null,\"description\":null,\"imageId\":null}")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    UPDATED_FACE_ID=$(jq -r '.data.face.id' "$TEMP_RES")
    UPDATED_IMAGE_ID=$(jq -r '.data.face.image' "$TEMP_RES")
    UPDATED_NAME=$(jq -r '.data.face.name' "$TEMP_RES")
    UPDATED_EMOJI=$(jq -r '.data.face.emoji' "$TEMP_RES")
    UPDATED_DESC=$(jq -r '.data.face.description' "$TEMP_RES")
    UPDATED_VIS=$(jq -r '.data.face.visibility' "$TEMP_RES")
    assert "F-7: 自分の Face 更新（画像削除）(200)" 200 "$HTTP_STATUS" "true" "$SUCCESS" \
        "$([ "$UPDATED_FACE_ID" = "$FACE1_ID" ] && [ "$UPDATED_IMAGE_ID" = "null" ] && [ "$UPDATED_NAME" = "Updated Face No Image" ] && [ "$UPDATED_EMOJI" = "null" ] && [ "$UPDATED_DESC" = "null" ] && [ "$UPDATED_VIS" = "public" ] && echo true || echo false)" \
        "更新内容が正しく反映されているか（画像削除）"

    # [8] 自分の Face の visibility を変更しようとする → 400
    echo "[F-8] 自分の Face の visibility を変更しようとする → 400"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" -X PUT "$BASE_URL/faces/$FACE1_ID" \
        -H "Authorization: Bearer $U1_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"Updated Face\",\"visibility\":\"private\"}")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    assert "F-8: visibility 変更エラー (400)" 400 "$HTTP_STATUS" "false" "$SUCCESS"

    # [9] 他人の Face を更新 → 403
    echo "[F-9] User1 が User2 の Face を更新 → 403"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" -X PUT "$BASE_URL/faces/$U2_FACE_ID" \
        -H "Authorization: Bearer $U1_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"Hacked Face\",\"emoji\":null,\"description\":null,\"imageId\":null}")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    assert "F-9: 他人 Face 更新 → 403" 403 "$HTTP_STATUS" "false" "$SUCCESS"

    # [10] 存在しない faceId を更新 → 404
    FAKE_FACE_ID=$(generate_uuid)
    echo "[F-10] 存在しない faceId を更新 → 404"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" -X PUT "$BASE_URL/faces/$FAKE_FACE_ID" \
        -H "Authorization: Bearer $U1_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"Ghost Face\",\"emoji\":null,\"description\":null,\"imageId\":null}")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    assert "F-10: 存在しない faceId 更新 → 404" 404 "$HTTP_STATUS" "false" "$SUCCESS"

    # ----------------------------------------------------------------
    # GET /faces — Face 一覧取得
    # ----------------------------------------------------------------
    echo "--- [Face] GET /faces ---"

    # [11] パラメータなし（全件取得）
    echo "[F-11] パラメータなし（全件取得）"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" -X GET "$BASE_URL/faces" \
        -H "Authorization: Bearer $U1_TOKEN")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    COUNT=$(jq -r '.data.faces.faceSummaries | length' "$TEMP_RES")
    assert "F-11: 全件取得 (200)" 200 "$HTTP_STATUS" "true" "$SUCCESS" \
        "$([ "$COUNT" -ge 3 ] && echo true || echo false)" \
        "3件以上のFaceが取得できるか（作成した3件）"

    # [12] userId フィルタ（User1 のみ）
    echo "[F-12] userId フィルタ（User1 のみ）"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" \
        -G "$BASE_URL/faces" --data-urlencode "userId=$U1_ID" \
        -H "Authorization: Bearer $U1_TOKEN")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    U1_FACE_COUNT=$(jq -r '.data.faces.faceSummaries | length' "$TEMP_RES")
    assert "F-12: userId フィルタ (200)" 200 "$HTTP_STATUS" "true" "$SUCCESS" \
        "$([ "$U1_FACE_COUNT" -eq 2 ] && echo true || echo false)" \
        "User1 の Face が2件取得できるか"

    # [13] q（キーワード）検索
    echo "[F-13] q（キーワード）検索 — 'Updated' で検索"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" \
        -G "$BASE_URL/faces" --data-urlencode "q=Updated" \
        -H "Authorization: Bearer $U1_TOKEN")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    KEYWORD_COUNT=$(jq -r '.data.faces.faceSummaries | length' "$TEMP_RES")
    assert "F-13: キーワード検索 'Updated' (200)" 200 "$HTTP_STATUS" "true" "$SUCCESS" \
        "$([ "$KEYWORD_COUNT" -ge 1 ] && echo true || echo false)" \
        "キーワードに一致するFaceが1件以上"

    # [14] sortBy=lastpostedAt&order=desc
    echo "[F-14] sortBy=lastpostedAt&order=desc"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" \
        -G "$BASE_URL/faces" \
        --data-urlencode "sortBy=lastpostedAt" \
        --data-urlencode "order=desc" \
        -H "Authorization: Bearer $U1_TOKEN")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    assert "F-14: sortBy=lastpostedAt&order=desc (200)" 200 "$HTTP_STATUS" "true" "$SUCCESS"

    # [15] sortBy=seedsCount&order=asc
    echo "[F-15] sortBy=seedsCount&order=asc"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" \
        -G "$BASE_URL/faces" \
        --data-urlencode "sortBy=seedsCount" \
        --data-urlencode "order=asc" \
        -H "Authorization: Bearer $U1_TOKEN")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    assert "F-15: sortBy=seedsCount&order=asc (200)" 200 "$HTTP_STATUS" "true" "$SUCCESS"

    # [16] limit=1 でページネーション（nextCursor が返るか）
    echo "[F-16] limit=1 でページネーション確認（nextCursor）"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" \
        -G "$BASE_URL/faces" --data-urlencode "limit=1" \
        -H "Authorization: Bearer $U1_TOKEN")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    NEXT_CURSOR=$(jq -r '.data.faces.nextCursor' "$TEMP_RES")
    FACE_COUNT_P1=$(jq -r '.data.faces.faceSummaries | length' "$TEMP_RES")
    assert "F-16: limit=1 ページネーション (200)" 200 "$HTTP_STATUS" "true" "$SUCCESS" \
        "$([ "$FACE_COUNT_P1" -eq 1 ] && [ "$NEXT_CURSOR" != "null" ] && echo true || echo false)" \
        "1件だけ返り nextCursor が存在するか"

    # [17] cursor 指定で 2 ページ目を取得
    echo "[F-17] cursor 指定で 2 ページ目取得"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" \
        -G "$BASE_URL/faces" \
        --data-urlencode "limit=1" \
        --data-urlencode "cursor=$NEXT_CURSOR" \
        -H "Authorization: Bearer $U1_TOKEN")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    FACE_COUNT_P2=$(jq -r '.data.faces.faceSummaries | length' "$TEMP_RES")
    FIRST_P2_ID=$(jq -r '.data.faces.faceSummaries[0].face.id' "$TEMP_RES")
    assert "F-17: cursor で 2 ページ目取得 (200)" 200 "$HTTP_STATUS" "true" "$SUCCESS" \
        "$([ "$FACE_COUNT_P2" -eq 1 ] && [ "$FIRST_P2_ID" != "$NEXT_CURSOR" ] && echo true || echo false)" \
        "1件返り、且つカーソルの Face とは別の Face か"

    # [18] 認証なし → 401
    echo "[F-18] GET /faces 認証なし → 401"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" -X GET "$BASE_URL/faces")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    assert "F-18: GET /faces 認証なし (401)" 401 "$HTTP_STATUS" "false" "$SUCCESS"

    # ----------------------------------------------------------------
    # GET /faces/:faceId — Face 単体取得
    # ----------------------------------------------------------------
    echo "--- [Face] GET /faces/:faceId ---"

    # [19] 存在する faceId を取得
    echo "[F-19] 存在する faceId を取得"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" -X GET "$BASE_URL/faces/$FACE1_ID" \
        -H "Authorization: Bearer $U1_TOKEN")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    FETCHED_ID=$(jq -r '.data.face.id' "$TEMP_RES")
    FETCHED_USER_ID=$(jq -r '.data.face.userId' "$TEMP_RES")
    FETCHED_NAME=$(jq -r '.data.face.name' "$TEMP_RES")
    assert "F-19: 単体取得 (200)" 200 "$HTTP_STATUS" "true" "$SUCCESS" \
        "$([ "$FETCHED_ID" = "$FACE1_ID" ] && [ "$FETCHED_USER_ID" = "$U1_ID" ] && [ -n "$FETCHED_NAME" ] && echo true || echo false)" \
        "id, userId, name が正しく取得できているか"

    # [20] 存在しない faceId を取得 → 404
    echo "[F-20] 存在しない faceId を取得 → 404"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" -X GET "$BASE_URL/faces/$FAKE_FACE_ID" \
        -H "Authorization: Bearer $U1_TOKEN")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    assert "F-20: 存在しない faceId 取得 → 404" 404 "$HTTP_STATUS" "false" "$SUCCESS"

    # [21] 認証なし → 401
    echo "[F-21] 認証なし → 401"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" -X GET "$BASE_URL/faces/$FACE1_ID")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    assert "F-21: 認証なし (401)" 401 "$HTTP_STATUS" "false" "$SUCCESS"

    # ----------------------------------------------------------------
    # DELETE /faces/:faceId — Face 削除
    # ----------------------------------------------------------------
    echo "--- [Face] DELETE /faces/:faceId ---"

    # [22] 他人の Face を削除 → 403
    echo "[F-22] User1 が User2 の Face を削除 → 403"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" -X DELETE "$BASE_URL/faces/$U2_FACE_ID" \
        -H "Authorization: Bearer $U1_TOKEN")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    assert "F-22: 他人 Face 削除 → 403" 403 "$HTTP_STATUS" "false" "$SUCCESS"

    # [23] 存在しない faceId を削除 → 404
    echo "[F-23] 存在しない faceId を削除 → 404"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" -X DELETE "$BASE_URL/faces/$FAKE_FACE_ID" \
        -H "Authorization: Bearer $U1_TOKEN")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    assert "F-23: 存在しない faceId 削除 → 404" 404 "$HTTP_STATUS" "false" "$SUCCESS"

    # [24] 自分の Face を削除 → 204（FACE2 を削除）
    echo "[F-24] 自分の Face を削除 → 204"
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL/faces/$FACE2_ID" \
        -H "Authorization: Bearer $U1_TOKEN")
    # 204 は body なし
    if [ "$HTTP_STATUS" -eq 204 ]; then
        echo "  => [PASS] F-24: 自分の Face 削除 (204)"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo "  => [FAIL] F-24: 自分の Face 削除 (204) — HTTP Status: $HTTP_STATUS"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
    echo ""

    # [25] 削除済みの Face を再削除 → 404
    echo "[F-25] 削除済み faceId を再削除 → 404"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" -X DELETE "$BASE_URL/faces/$FACE2_ID" \
        -H "Authorization: Bearer $U1_TOKEN")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    assert "F-25: 削除済み Face 再削除 → 404" 404 "$HTTP_STATUS" "false" "$SUCCESS"

    # --- Face テスト用の状態保存（FACE1_ID, U2_FACE_ID を Seed テストで使う）---
    {
        source "$STATE_FILE"
        cat <<EOF > "$STATE_FILE"
U1_ID="$U1_ID"
U1_TOKEN="$U1_TOKEN"
U1_REFRESH="$U1_REFRESH"
U2_ID="$U2_ID"
U2_TOKEN="$U2_TOKEN"
U2_REFRESH="$U2_REFRESH"
IMAGE1_ID="$IMAGE1_ID"
IMAGE2_ID="$IMAGE2_ID"
FACE1_ID="$FACE1_ID"
U2_FACE_ID="$U2_FACE_ID"
EOF
    }
}

# ==========================================
# 3. Seed API テスト
# ==========================================
run_seed_tests() {
    load_state
    echo "=== 【テスト実行】Seed API ==="

    FAKE_SEED_ID=$(generate_uuid)
    FAKE_FACE_ID=$(generate_uuid)

    # ----------------------------------------------------------------
    # POST /seeds — Seed 作成
    # ----------------------------------------------------------------
    echo "--- [Seed] POST /seeds ---"

    # [1] 画像なしで Seed 作成（User1, FACE1）
    echo "[S-1] 画像なしで Seed 作成"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" -X POST "$BASE_URL/seeds" \
        -H "Authorization: Bearer $U1_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"faceId\":\"$FACE1_ID\",\"body\":\"Hello Seed without images\",\"imageIds\":[]}")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    SEED1_ID=$(jq -r '.data.seed.id' "$TEMP_RES")
    SEED_BODY=$(jq -r '.data.seed.body' "$TEMP_RES")
    IMG_COUNT=$(jq -r '.data.seed.images | length' "$TEMP_RES")
    assert "S-1: 画像なし Seed 作成 (201)" 201 "$HTTP_STATUS" "true" "$SUCCESS" \
        "$([ "$SEED_BODY" = "Hello Seed without images" ] && [ "$IMG_COUNT" -eq 0 ] && echo true || echo false)" \
        "body が正しく画像数が0か"

    # [2] 画像1枚で Seed 作成
    echo "[S-2] 画像1枚で Seed 作成"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" -X POST "$BASE_URL/seeds" \
        -H "Authorization: Bearer $U1_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"faceId\":\"$FACE1_ID\",\"body\":\"Seed with 1 image\",\"imageIds\":[\"$IMAGE1_ID\"]}")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    SEED2_ID=$(jq -r '.data.seed.id' "$TEMP_RES")
    IMG_COUNT=$(jq -r '.data.seed.images | length' "$TEMP_RES")
    assert "S-2: 画像1枚 Seed 作成 (201)" 201 "$HTTP_STATUS" "true" "$SUCCESS" \
        "$([ "$IMG_COUNT" -eq 1 ] && echo true || echo false)" \
        "画像数が1か"

    # [3] 画像2枚で Seed 作成
    echo "[S-3] 画像2枚で Seed 作成"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" -X POST "$BASE_URL/seeds" \
        -H "Authorization: Bearer $U1_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"faceId\":\"$FACE1_ID\",\"body\":\"Seed with 2 images\",\"imageIds\":[\"$IMAGE1_ID\",\"$IMAGE2_ID\"]}")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    SEED3_ID=$(jq -r '.data.seed.id' "$TEMP_RES")
    IMG_COUNT=$(jq -r '.data.seed.images | length' "$TEMP_RES")
    IMG_ORDER1=$(jq -r '.data.seed.images[0].id' "$TEMP_RES")
    IMG_ORDER2=$(jq -r '.data.seed.images[1].id' "$TEMP_RES")
    assert "S-3: 画像2枚 Seed 作成（順序確認）(201)" 201 "$HTTP_STATUS" "true" "$SUCCESS" \
        "$([ "$IMG_COUNT" -eq 2 ] && [ "$IMG_ORDER1" = "$IMAGE1_ID" ] && [ "$IMG_ORDER2" = "$IMAGE2_ID" ] && echo true || echo false)" \
        "画像数が2かつ順序が正しいか"

    # [4] User2 の faceId を指定 → 403（他人の Face への投稿防止）
    echo "[S-4] User1 が User2 の faceId を指定 → 403（セキュリティ検証）"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" -X POST "$BASE_URL/seeds" \
        -H "Authorization: Bearer $U1_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"faceId\":\"$U2_FACE_ID\",\"body\":\"Injected seed\",\"imageIds\":[]}")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    assert "S-4: 他人の faceId 指定 → 403" 403 "$HTTP_STATUS" "false" "$SUCCESS"

    # [5] 存在しない faceId を指定 → 404
    echo "[S-5] 存在しない faceId を指定 → 404"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" -X POST "$BASE_URL/seeds" \
        -H "Authorization: Bearer $U1_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"faceId\":\"$FAKE_FACE_ID\",\"body\":\"Ghost seed\",\"imageIds\":[]}")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    assert "S-5: 存在しない faceId → 404" 404 "$HTTP_STATUS" "false" "$SUCCESS"

    # [6] body が空文字（バリデーションエラー）
    echo "[S-6] body 空文字 → バリデーションエラー (400)"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" -X POST "$BASE_URL/seeds" \
        -H "Authorization: Bearer $U1_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"faceId\":\"$FACE1_ID\",\"body\":\"\",\"imageIds\":[]}")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    assert "S-6: body 空文字バリデーションエラー (400)" 400 "$HTTP_STATUS" "false" "$SUCCESS"

    # [7] 認証なし → 401
    echo "[S-7] POST /seeds 認証なし → 401"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" -X POST "$BASE_URL/seeds" \
        -H "Content-Type: application/json" \
        -d "{\"faceId\":\"$FACE1_ID\",\"body\":\"No auth seed\",\"imageIds\":[]}")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    assert "S-7: POST /seeds 認証なし (401)" 401 "$HTTP_STATUS" "false" "$SUCCESS"

    # ----------------------------------------------------------------
    # PUT /seeds/:seedId — Seed 更新
    # ----------------------------------------------------------------
    echo "--- [Seed] PUT /seeds/:seedId ---"

    # [8] 自分の Seed を画像なしに更新
    echo "[S-8] 自分の Seed を更新（画像なし）"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" -X PUT "$BASE_URL/seeds/$SEED2_ID" \
        -H "Authorization: Bearer $U1_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"body\":\"Updated seed without images\",\"imageIds\":[]}")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    UPDATED_BODY=$(jq -r '.data.seed.body' "$TEMP_RES")
    UPDATED_IMG_COUNT=$(jq -r '.data.seed.images | length' "$TEMP_RES")
    assert "S-8: Seed 更新（画像なし）(200)" 200 "$HTTP_STATUS" "true" "$SUCCESS" \
        "$([ "$UPDATED_BODY" = "Updated seed without images" ] && [ "$UPDATED_IMG_COUNT" -eq 0 ] && echo true || echo false)" \
        "body が更新され画像数が0か"

    # [9] 自分の Seed を画像1枚で更新
    echo "[S-9] 自分の Seed を更新（画像1枚）"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" -X PUT "$BASE_URL/seeds/$SEED2_ID" \
        -H "Authorization: Bearer $U1_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"body\":\"Updated seed with 1 image\",\"imageIds\":[\"$IMAGE2_ID\"]}")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    UPDATED_BODY=$(jq -r '.data.seed.body' "$TEMP_RES")
    UPDATED_IMG_COUNT=$(jq -r '.data.seed.images | length' "$TEMP_RES")
    UPDATED_IMG_ID=$(jq -r '.data.seed.images[0].id' "$TEMP_RES")
    assert "S-9: Seed 更新（画像1枚）(200)" 200 "$HTTP_STATUS" "true" "$SUCCESS" \
        "$([ "$UPDATED_BODY" = "Updated seed with 1 image" ] && [ "$UPDATED_IMG_COUNT" -eq 1 ] && [ "$UPDATED_IMG_ID" = "$IMAGE2_ID" ] && echo true || echo false)" \
        "body が更新され画像数が1かつ正しい画像IDか"

    # [10] User2 が User1 の Seed を更新 → 403
    echo "[S-10] User2 が User1 の Seed を更新 → 403"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" -X PUT "$BASE_URL/seeds/$SEED1_ID" \
        -H "Authorization: Bearer $U2_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"body\":\"Hacked seed\",\"imageIds\":[]}")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    assert "S-10: 他人 Seed 更新 → 403" 403 "$HTTP_STATUS" "false" "$SUCCESS"

    # [11] 存在しない seedId を更新 → 404
    echo "[S-11] 存在しない seedId を更新 → 404"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" -X PUT "$BASE_URL/seeds/$FAKE_SEED_ID" \
        -H "Authorization: Bearer $U1_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"body\":\"Ghost seed update\",\"imageIds\":[]}")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    assert "S-11: 存在しない seedId 更新 → 404" 404 "$HTTP_STATUS" "false" "$SUCCESS"

    # ----------------------------------------------------------------
    # GET /seeds — Seed 一覧取得
    # ----------------------------------------------------------------
    echo "--- [Seed] GET /seeds ---"

    # [12] パラメータなし（全件取得）
    echo "[S-12] パラメータなし（全件取得）"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" -X GET "$BASE_URL/seeds" \
        -H "Authorization: Bearer $U1_TOKEN")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    SEED_COUNT=$(jq -r '.data.seeds.seeds | length' "$TEMP_RES")
    assert "S-12: 全件取得 (200)" 200 "$HTTP_STATUS" "true" "$SUCCESS" \
        "$([ "$SEED_COUNT" -ge 3 ] && echo true || echo false)" \
        "3件以上の Seed が取得できるか"

    # [13] faceId フィルタ
    echo "[S-13] faceId フィルタ（FACE1 の Seed のみ）"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" \
        -G "$BASE_URL/seeds" --data-urlencode "faceId=$FACE1_ID" \
        -H "Authorization: Bearer $U1_TOKEN")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    FACE_SEED_COUNT=$(jq -r '.data.seeds.seeds | length' "$TEMP_RES")
    assert "S-13: faceId フィルタ (200)" 200 "$HTTP_STATUS" "true" "$SUCCESS" \
        "$([ "$FACE_SEED_COUNT" -ge 3 ] && echo true || echo false)" \
        "FACE1 の Seed が3件以上取得できるか"

    # [14] userId フィルタ（User1 のみ）
    echo "[S-14] userId フィルタ（User1 のみ）"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" \
        -G "$BASE_URL/seeds" --data-urlencode "userId=$U1_ID" \
        -H "Authorization: Bearer $U1_TOKEN")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    U1_SEED_COUNT=$(jq -r '.data.seeds.seeds | length' "$TEMP_RES")
    assert "S-14: userId フィルタ (200)" 200 "$HTTP_STATUS" "true" "$SUCCESS" \
        "$([ "$U1_SEED_COUNT" -ge 3 ] && echo true || echo false)" \
        "User1 の Seed が3件以上取得できるか"

    # [15] q（キーワード）検索
    echo "[S-15] q（キーワード）検索 — 'Hello' で検索"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" \
        -G "$BASE_URL/seeds" --data-urlencode "q=Hello" \
        -H "Authorization: Bearer $U1_TOKEN")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    KEYWORD_COUNT=$(jq -r '.data.seeds.seeds | length' "$TEMP_RES")
    assert "S-15: キーワード検索 'Hello' (200)" 200 "$HTTP_STATUS" "true" "$SUCCESS" \
        "$([ "$KEYWORD_COUNT" -ge 1 ] && echo true || echo false)" \
        "キーワードに一致する Seed が1件以上"

    # [16] fromDate / toDate フィルタ（現在日時を基準）
    FROM_DATE="2000-01-01T00:00:00Z"
    TO_DATE="2099-12-31T23:59:59Z"
    echo "[S-16] fromDate / toDate フィルタ（広い範囲）"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" \
        -G "$BASE_URL/seeds" \
        --data-urlencode "fromDate=$FROM_DATE" \
        --data-urlencode "toDate=$TO_DATE" \
        -H "Authorization: Bearer $U1_TOKEN")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    DATE_COUNT=$(jq -r '.data.seeds.seeds | length' "$TEMP_RES")
    assert "S-16: fromDate/toDate フィルタ (200)" 200 "$HTTP_STATUS" "true" "$SUCCESS" \
        "$([ "$DATE_COUNT" -ge 3 ] && echo true || echo false)" \
        "日付範囲内の Seed が3件以上取得できるか"

    # [17] fromDate を未来にして 0 件確認
    FUTURE_DATE="2099-01-01T00:00:00Z"
    echo "[S-17] fromDate を未来にして 0 件確認"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" \
        -G "$BASE_URL/seeds" --data-urlencode "fromDate=$FUTURE_DATE" \
        -H "Authorization: Bearer $U1_TOKEN")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    FUTURE_COUNT=$(jq -r '.data.seeds.seeds | length' "$TEMP_RES")
    assert "S-17: fromDate=未来 で 0 件 (200)" 200 "$HTTP_STATUS" "true" "$SUCCESS" \
        "$([ "$FUTURE_COUNT" -eq 0 ] && echo true || echo false)" \
        "未来の fromDate で 0 件が返るか"

    # [18] order=asc（昇順）
    echo "[S-18] order=asc（昇順）"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" \
        -G "$BASE_URL/seeds" --data-urlencode "order=asc" \
        -H "Authorization: Bearer $U1_TOKEN")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    assert "S-18: order=asc (200)" 200 "$HTTP_STATUS" "true" "$SUCCESS"

    # [19] limit=1 でページネーション（nextCursor が返るか）
    echo "[S-19] limit=1 でページネーション確認（nextCursor）"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" \
        -G "$BASE_URL/seeds" --data-urlencode "limit=1" \
        -H "Authorization: Bearer $U1_TOKEN")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    SEED_CURSOR=$(jq -r '.data.seeds.nextCursor' "$TEMP_RES")
    SEED_COUNT_P1=$(jq -r '.data.seeds.seeds | length' "$TEMP_RES")
    assert "S-19: limit=1 ページネーション (200)" 200 "$HTTP_STATUS" "true" "$SUCCESS" \
        "$([ "$SEED_COUNT_P1" -eq 1 ] && [ "$SEED_CURSOR" != "null" ] && echo true || echo false)" \
        "1件だけ返り nextCursor が存在するか"

    # [20] cursor 指定で 2 ページ目を取得
    echo "[S-20] cursor 指定で 2 ページ目取得"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" \
        -G "$BASE_URL/seeds" \
        --data-urlencode "limit=1" \
        --data-urlencode "cursor=$SEED_CURSOR" \
        -H "Authorization: Bearer $U1_TOKEN")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    SEED_COUNT_P2=$(jq -r '.data.seeds.seeds | length' "$TEMP_RES")
    FIRST_P2_SEED_ID=$(jq -r '.data.seeds.seeds[0].id' "$TEMP_RES")
    assert "S-20: cursor で 2 ページ目取得 (200)" 200 "$HTTP_STATUS" "true" "$SUCCESS" \
        "$([ "$SEED_COUNT_P2" -eq 1 ] && [ "$FIRST_P2_SEED_ID" != "$SEED_CURSOR" ] && echo true || echo false)" \
        "1件返り、且つカーソルの Seed とは別の Seed か"

    # [21] 認証なし → 401
    echo "[S-21] GET /seeds 認証なし → 401"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" -X GET "$BASE_URL/seeds")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    assert "S-21: GET /seeds 認証なし (401)" 401 "$HTTP_STATUS" "false" "$SUCCESS"

    # ----------------------------------------------------------------
    # GET /seeds/:seedId — Seed 単体取得
    # ----------------------------------------------------------------
    echo "--- [Seed] GET /seeds/:seedId ---"

    # [22] 存在する seedId を取得
    echo "[S-22] 存在する seedId を取得"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" -X GET "$BASE_URL/seeds/$SEED2_ID" \
        -H "Authorization: Bearer $U1_TOKEN")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    FETCHED_ID=$(jq -r '.data.seed.id' "$TEMP_RES")
    FETCHED_FACE_ID=$(jq -r '.data.seed.faceId' "$TEMP_RES")
    FETCHED_USER_ID=$(jq -r '.data.seed.userId' "$TEMP_RES")
    assert "S-22: 単体取得 (200)" 200 "$HTTP_STATUS" "true" "$SUCCESS" \
        "$([ "$FETCHED_ID" = "$SEED2_ID" ] && [ "$FETCHED_FACE_ID" = "$FACE1_ID" ] && [ "$FETCHED_USER_ID" = "$U1_ID" ] && echo true || echo false)" \
        "id, faceId, userId が正しく取得できているか"

    # [23] 存在しない seedId を取得 → 404
    echo "[S-23] 存在しない seedId を取得 → 404"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" -X GET "$BASE_URL/seeds/$FAKE_SEED_ID" \
        -H "Authorization: Bearer $U1_TOKEN")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    assert "S-23: 存在しない seedId 取得 → 404" 404 "$HTTP_STATUS" "false" "$SUCCESS"

    # [24] 認証なし → 401
    echo "[S-24] 認証なし → 401"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" -X GET "$BASE_URL/seeds/$SEED2_ID")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    assert "S-24: 認証なし (401)" 401 "$HTTP_STATUS" "false" "$SUCCESS"

    # ----------------------------------------------------------------
    # DELETE /seeds/:seedId — Seed 削除
    # ----------------------------------------------------------------
    echo "--- [Seed] DELETE /seeds/:seedId ---"

    # [25] 他人の Seed を削除 → 403
    echo "[S-25] User2 が User1 の Seed を削除 → 403"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" -X DELETE "$BASE_URL/seeds/$SEED1_ID" \
        -H "Authorization: Bearer $U2_TOKEN")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    assert "S-25: 他人 Seed 削除 → 403" 403 "$HTTP_STATUS" "false" "$SUCCESS"

    # [26] 存在しない seedId を削除 → 404
    echo "[S-26] 存在しない seedId を削除 → 404"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" -X DELETE "$BASE_URL/seeds/$FAKE_SEED_ID" \
        -H "Authorization: Bearer $U1_TOKEN")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    assert "S-26: 存在しない seedId 削除 → 404" 404 "$HTTP_STATUS" "false" "$SUCCESS"

    # [27] 自分の Seed を削除 → 204（SEED3 を削除）
    echo "[S-27] 自分の Seed を削除 → 204"
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL/seeds/$SEED3_ID" \
        -H "Authorization: Bearer $U1_TOKEN")
    if [ "$HTTP_STATUS" -eq 204 ]; then
        echo "  => [PASS] S-27: 自分の Seed 削除 (204)"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo "  => [FAIL] S-27: 自分の Seed 削除 (204) — HTTP Status: $HTTP_STATUS"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
    echo ""

    # [28] 削除済み Seed を再削除 → 404
    echo "[S-28] 削除済み Seed を再削除 → 404"
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" -X DELETE "$BASE_URL/seeds/$SEED3_ID" \
        -H "Authorization: Bearer $U1_TOKEN")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    assert "S-28: 削除済み Seed 再削除 → 404" 404 "$HTTP_STATUS" "false" "$SUCCESS"

    # ----------------------------------------------------------------
    # Face 削除時の Cascade 確認（関連 Seed の削除）
    # ----------------------------------------------------------------
    echo "--- [Cascade] Face 削除 → 関連 Seed も削除されるか ---"

    # User2 で Face 作成 → Seed 作成 → Face 削除 → Seed が消えているか確認
    echo "[C-1] User2 で Face と Seed を作成し、Face 削除後に GET /seeds で確認"
    RES=$(curl -s -X POST "$BASE_URL/faces" \
        -H "Authorization: Bearer $U2_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"Cascade Face\",\"emoji\":null,\"description\":null,\"imageId\":null,\"visibility\":\"public\"}")
    CASCADE_FACE_ID=$(echo "$RES" | jq -r '.data.face.id')

    RES=$(curl -s -X POST "$BASE_URL/seeds" \
        -H "Authorization: Bearer $U2_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"faceId\":\"$CASCADE_FACE_ID\",\"body\":\"Cascade seed\",\"imageIds\":[]}")
    CASCADE_SEED_ID=$(echo "$RES" | jq -r '.data.seed.id')

    # Face を削除
    curl -s -o /dev/null -X DELETE "$BASE_URL/faces/$CASCADE_FACE_ID" \
        -H "Authorization: Bearer $U2_TOKEN"

    # 削除された Seed を取得しようとする → 404 or 空リスト
    HTTP_STATUS=$(curl -s -o "$TEMP_RES" -w "%{http_code}" \
        -G "$BASE_URL/seeds" --data-urlencode "faceId=$CASCADE_FACE_ID" \
        -H "Authorization: Bearer $U2_TOKEN")
    SUCCESS=$(jq -r '.success' "$TEMP_RES")
    REMAINING=$(jq -r '.data.seeds.seeds | length' "$TEMP_RES")
    assert "C-1: Face 削除 → 関連 Seed が 0 件 (200)" 200 "$HTTP_STATUS" "true" "$SUCCESS" \
        "$([ "$REMAINING" -eq 0 ] && echo true || echo false)" \
        "Face 削除後に関連 Seed が 0 件になるか"
}

# ==========================================
# 4. 後処理（ログアウト & ユーザー削除）
# ==========================================
cleanup() {
    if [ -f "$STATE_FILE" ]; then
        source "$STATE_FILE"
    fi
    echo "=== 【後処理】ログアウト & ユーザー削除 & クリーンアップ ==="

    if [ -n "$U1_TOKEN" ]; then
        echo "Logging out User1..."
        curl -s -o /dev/null -X POST "$BASE_URL/auth/sign-out" \
            -H "Authorization: Bearer $U1_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{\"refreshToken\":\"$U1_REFRESH\"}"
    fi

    if [ -n "$U1_ID" ] && [ -n "$U1_TOKEN" ]; then
        echo "Deleting User1 (cascades Face & Seed)..."
        curl -s -o /dev/null -X DELETE "$BASE_URL/users/$U1_ID" \
            -H "Authorization: Bearer $U1_TOKEN"
    fi

    if [ -n "$U2_TOKEN" ]; then
        echo "Logging out User2..."
        curl -s -o /dev/null -X POST "$BASE_URL/auth/sign-out" \
            -H "Authorization: Bearer $U2_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{\"refreshToken\":\"$U2_REFRESH\"}"
    fi

    if [ -n "$U2_ID" ] && [ -n "$U2_TOKEN" ]; then
        echo "Deleting User2 (cascades Face & Seed)..."
        curl -s -o /dev/null -X DELETE "$BASE_URL/users/$U2_ID" \
            -H "Authorization: Bearer $U2_TOKEN"
    fi

    echo "Removing temporary files..."
    rm -f "$TEST_IMAGE" "$STATE_FILE" "$TEMP_RES"

    echo "=> 後処理完了。"
    echo ""
}

# ==========================================
# テスト結果サマリー表示
# ==========================================
print_summary() {
    local total=$((PASS_COUNT + FAIL_COUNT))
    echo "=========================================="
    echo "  テスト結果サマリー"
    echo "=========================================="
    echo "  PASS : $PASS_COUNT / $total"
    echo "  FAIL : $FAIL_COUNT / $total"
    echo "=========================================="
    if [ "$FAIL_COUNT" -eq 0 ]; then
        echo "  🎉 すべてのテストが成功しました！"
        return 0
    else
        echo "  ❌ 失敗したテストがあります。上記ログを確認してください。"
        return 1
    fi
    echo ""
}

# ==========================================
# コマンドのルーティング
# ==========================================
case "$1" in
    setup)
        setup
        ;;
    face)
        run_face_tests
        print_summary
        ;;
    seed)
        run_seed_tests
        print_summary
        ;;
    cleanup)
        cleanup
        ;;
    all)
        trap cleanup EXIT INT TERM

        setup
        run_face_tests
        run_seed_tests
        print_summary
        summary_status=$?
        cleanup
        if [ "$summary_status" -ne 0 ]; then
            exit 1 # テスト失敗時は非0で終了
        fi
        ;;
    *)
        echo "使用方法: $0 {setup|face|seed|cleanup|all}"
        echo "  setup   : 準備（ユーザー作成・画像アップロード）"
        echo "  face    : Face API テスト実行（CRUD + 検索クエリ）"
        echo "  seed    : Seed API テスト実行（CRUD + 検索クエリ + セキュリティ）"
        echo "  cleanup : 後処理（ログアウト・ユーザー削除・一時ファイル削除）"
        echo "  all     : setup → face → seed → cleanup を一括実行"
        exit 1
        ;;
esac
