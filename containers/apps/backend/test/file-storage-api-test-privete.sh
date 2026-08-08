#!/bin/bash

# ==========================================
# 設定・変数定義
# ==========================================
BASE_URL=${BASE_URL:-"http://localhost:8000/api/v1"}
STATE_FILE=".storage_test_state"

API_KEY=${MASTER_API_KEY:-"tracen_master_api_key"}  # APIキー（必要に応じて変更）

# テスト用ダミー画像の設定
TEST_IMAGE="test_source.jpg"
DOWNLOADED_IMAGE="test_downloaded.jpg"
IMAGE_SIZE_MB=2 # テストするファイルサイズ (MB)

# テスト用ユーザーデータ1
U1_EMAIL="user1_private@example.com"
U1_NAME="Private User 1"
U1_PASS="password1234"

# テスト用ユーザーデータ2
U2_EMAIL="user2_private@example.com"
U2_NAME="Private User 2"
U2_PASS="password1234"

# ==========================================
# ヘルパー関数
# ==========================================
# 必須コマンドの存在チェック
for cmd in jq curl; do
    if ! command -v $cmd &> /dev/null; then
        echo "Error: $cmd がインストールされていません。インストールしてから再実行してください。"
        exit 1
    fi
done

# ハッシュ算出コマンドの選定
get_checksum() {
    if command -v md5sum &> /dev/null; then
        md5sum "$1" | awk '{print $1}'
    elif command -v shasum &> /dev/null; then
        shasum -a 256 "$1" | awk '{print $1}'
    else
        cksum "$1" | awk '{print $1}'
    fi
}

# 状態の保存
save_state() {
    cat <<EOF > "$STATE_FILE"
U1_ID="$U1_ID"
U1_TOKEN="$U1_TOKEN"
U1_REFRESH="$U1_REFRESH"
U1_FILE_ID="$U1_FILE_ID"
U2_ID="$U2_ID"
U2_TOKEN="$U2_TOKEN"
U2_REFRESH="$U2_REFRESH"
U2_FILE_ID="$U2_FILE_ID"
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

# ダウンロードの共通検証関数
run_download_assertion() {
    local file_id="$1"
    local token="$2"
    local expected_status="$3"
    local validate_checksum="$4"
    local target_url="${BASE_URL}/file-storage/download/${file_id}"

    if [ -z "$file_id" ] || [ "$file_id" = "null" ]; then
        echo "Error: ダウンロード対象の fileId が空です。"
        exit 1
    fi

    echo "Downloading from: $target_url"

    # JWTトークンを付与してストリーム取得
    local http_status
    http_status=$(curl -s -w "%{http_code}" --no-buffer \
        -H "Authorization: Bearer $token" \
        -o "$DOWNLOADED_IMAGE" "$target_url")

    if [ "$http_status" -ne "$expected_status" ]; then
        echo "❌ Download Failed. Expected HTTP $expected_status but got $http_status."
        # エラー時はボディ（JSON）を表示
        cat "$DOWNLOADED_IMAGE"
        echo ""
        exit 1
    fi

    if [ "$expected_status" -eq 200 ]; then
        echo "  -> 🎉 Download Success (HTTP 200)."
    else
        echo "  -> ✅ Expected HTTP $expected_status confirmed."
        echo "  -> API Response: $(cat "$DOWNLOADED_IMAGE")"
    fi

    if [ "$validate_checksum" = "true" ] && [ "$expected_status" -eq 200 ]; then
        # --- 同一性検証（ハッシュチェック） ---
        echo "Checking data integrity (Checksum verification)..."
        SRC_HASH=$(get_checksum "$TEST_IMAGE")
        DL_HASH=$(get_checksum "$DOWNLOADED_IMAGE")

        echo "  -> Source File Checksum    : $SRC_HASH"
        echo "  -> Downloaded File Checksum: $DL_HASH"

        if [ "$SRC_HASH" = "$DL_HASH" ]; then
            echo "  ->  Validation OK! アップロードとダウンロードのデータは完全に一致しています。"
        else
            echo "  -> ❌ Validation Failed. データが破損または変形しています。"
            exit 1
        fi
    fi

    echo ""
}

# ==========================================
# テストブロック
# ==========================================

# 1. 準備 (サインアップ ＆ テスト用ファイルの自動生成)
setup() {
    echo "=== 【準備】ユーザー作成 ＆ テストファイルの準備 ==="

    echo "Generating $IMAGE_SIZE_MB MB dummy image file ($TEST_IMAGE)..."
    dd if=/dev/urandom of="$TEST_IMAGE" bs=1M count=$IMAGE_SIZE_MB 2>/dev/null

    for i in 1 2; do
        eval email=\$U${i}_EMAIL
        eval name=\$U${i}_NAME
        eval pass=\$U${i}_PASS

        echo "Signing up User $i ($email)..."
        RES=$(curl -s -X POST "$BASE_URL/auth/sign-up" \
            -H "Content-Type: application/json" \
            -H "X-API-Key: $API_KEY" \
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
        echo "  -> Success! User $i ID: $current_id"
    done

    save_state
    echo "=> 準備完了。状態を $STATE_FILE に保存しました。"
    echo ""
}

# 2. アップロードテスト (生のボディストリーム送信)
run_upload_test() {
    load_state
    echo "=== 【テスト実行】プライベートストリームアップロード ==="

    if [ ! -f "$TEST_IMAGE" ]; then
        echo "Error: テスト用ソースファイル ($TEST_IMAGE) が見つかりません。"
        exit 1
    fi

    local FILE_NAME="$TEST_IMAGE"
    local MIME_TYPE="image/jpeg"
    local FILE_SIZE=$(wc -c < "$TEST_IMAGE" | tr -d ' ')

    for i in 1 2; do
        eval token=\$U${i}_TOKEN
        echo "Uploading file for User $i via Stream (Size: $FILE_SIZE bytes)..."

        # x-visibility を private に変更
        RES_UPLOAD=$(curl -s -X POST "$BASE_URL/file-storage/upload" \
            -H "Authorization: Bearer $token" \
            -H "x-file-name: $FILE_NAME" \
            -H "x-file-type: $MIME_TYPE" \
            -H "content-length: $FILE_SIZE" \
            -H "x-visibility: private" \
            --data-binary @"$TEST_IMAGE")

        UPLOAD_SUCCESS=$(echo "$RES_UPLOAD" | jq -r '.success')

        if [ "$UPLOAD_SUCCESS" != "true" ]; then
            echo "❌ Upload Failed for User $i. Response: $RES_UPLOAD"
            exit 1
        fi

        local current_file_id=$(echo "$RES_UPLOAD" | jq -r '.data.fileId')
        declare U${i}_FILE_ID=$current_file_id

        echo "  -> 🎉 Upload Success! User $i Returned File ID: $current_file_id"
    done

    save_state
    echo ""
}

# 3. ダウンロードテスト (プライベートAPIのアクセス権限検証)
run_download_test() {
    load_state
    echo "=== 【テスト実行】プライベートダウンロードと認可制御の検証 ==="

    echo "[ケース1] User 1 が 自身のファイル をダウンロード (200 OK 期待)"
    run_download_assertion "$U1_FILE_ID" "$U1_TOKEN" 200 true

    echo "[ケース2] User 2 が 自身のファイル をダウンロード (200 OK 期待)"
    run_download_assertion "$U2_FILE_ID" "$U2_TOKEN" 200 true

    echo "[ケース3] User 1 が User 2 のファイル をダウンロード (403 Forbidden 期待)"
    run_download_assertion "$U2_FILE_ID" "$U1_TOKEN" 403 false
}

# 4. デリートテスト (2回削除と削除後ダウンロードの確認)
run_delete_test() {
    load_state
    echo "=== 【テスト実行】ファイル削除の検証 (User 1) ==="

    if [ -z "$U1_FILE_ID" ] || [ "$U1_FILE_ID" = "null" ]; then
        echo "Error: 削除対象の fileId (User 1) が状態ファイルに記録されていません。"
        exit 1
    fi

    echo "Deleting file (first attempt)..."
    RES_DELETE=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/file-storage/delete/$U1_FILE_ID" \
        -H "Authorization: Bearer $U1_TOKEN" \
        -H "Content-Type: application/json")
    DELETE_HTTP_STATUS=$(echo "$RES_DELETE" | tail -n 1)

    if [ "$DELETE_HTTP_STATUS" -ne 204 ]; then
        echo "❌ First delete failed. HTTP Status: $DELETE_HTTP_STATUS Response: $DELETE_BODY"
        exit 1
    fi
    echo "  -> 🎉 Delete Success (HTTP 204)."

    echo "Deleting file again (second attempt)..."
    RES_DELETE_REPEAT=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/file-storage/delete/$U1_FILE_ID" \
        -H "Authorization: Bearer $U1_TOKEN" \
        -H "Content-Type: application/json")
    DELETE_REPEAT_HTTP_STATUS=$(echo "$RES_DELETE_REPEAT" | tail -n 1)
    DELETE_REPEAT_BODY=$(echo "$RES_DELETE_REPEAT" | sed '$d')
    DELETE_REPEAT_SUCCESS=$(echo "$DELETE_REPEAT_BODY" | jq -r '.success')

    if [ "$DELETE_REPEAT_HTTP_STATUS" -ne 404 ] || [ "$DELETE_REPEAT_SUCCESS" != "false" ]; then
        echo "❌ Second delete failed. HTTP Status: $DELETE_REPEAT_HTTP_STATUS Response: $DELETE_REPEAT_BODY"
        exit 1
    fi
    echo "  -> ✅ Second delete confirmed (HTTP 404, success=false)."

    echo "Verifying download after deletion (404 期待)..."
    run_download_assertion "$U1_FILE_ID" "$U1_TOKEN" 404 false
}

# 5. 後処理 (ファイル削除 ＆ ログアウト ＆ ユーザー削除 ＆ テストファイルクリーンアップ)
cleanup() {
    if [ -f "$STATE_FILE" ]; then
        source "$STATE_FILE"
    fi

    echo "=== 【後処理】ファイルの削除、ログアウト、ユーザー削除、クリーンアップ ==="

    for i in 1 2; do
        eval token=\$U${i}_TOKEN
        eval refresh=\$U${i}_REFRESH
        eval id=\$U${i}_ID
        eval file_id=\$U${i}_FILE_ID

        # 1. ユーザー削除・ログアウトの【前】に、アップロードしたファイルを削除
        if [ -n "$file_id" ] && [ -n "$token" ]; then
            echo "Deleting remaining file for User $i..."
            curl -s -X DELETE "$BASE_URL/file-storage/delete/$file_id" \
                -H "Authorization: Bearer $token" \
                -H "Content-Type: application/json" > /dev/null
        fi

        # 2. ログアウト
        if [ -n "$token" ]; then
            echo "Logging out User $i..."
            curl -s -X POST "$BASE_URL/auth/sign-out" \
                -H "Authorization: Bearer $token" \
                -H "Content-Type: application/json" \
                -d "{\"refreshToken\":\"$refresh\"}" > /dev/null
        fi

        # 3. ユーザー削除
        if [ -n "$id" ] && [ -n "$token" ]; then
            echo "Deleting User $i account..."
            curl -s -X DELETE "$BASE_URL/users/$id" \
                -H "Authorization: Bearer $token" > /dev/null
        fi
    done

    echo "Removing temporary test files..."
    rm -f "$TEST_IMAGE" "$DOWNLOADED_IMAGE" "$STATE_FILE"

    echo "=> 後処理完了。環境はクリーンになりました。"
    echo ""
}

# ==========================================
# コマンドのルーティング
# ==========================================
case "$1" in
    setup)
        setup
        ;;
    upload)
        run_upload_test
        ;;
    download)
        run_download_test
        ;;
    delete)
        run_delete_test
        ;;
    cleanup)
        cleanup
        ;;
    all)
        setup
        run_upload_test
        run_download_test
        run_delete_test
        cleanup
        ;;
    *)
        echo "使用方法: $0 {setup|upload|download|delete|cleanup|all}"
        echo "  setup    : 準備（アカウント2つ作成とダミーファイルの生成）"
        echo "  upload   : テスト実行（それぞれのアカウントでプライベートアップロード）"
        echo "  download : テスト実行（正常ダウンロードと403アクセスの検証）"
        echo "  delete   : テスト実行（削除と削除後の404確認）"
        echo "  cleanup  : 後処理（ファイル・アカウント削除、一時ファイルのクリーンアップ）"
        echo "  all      : 全ステップを連続で一括実行"
        exit 1
        ;;
esac
