#!/bin/bash

# ==========================================
# 設定・変数定義
# ==========================================
BASE_URL=${BASE_URL:-"http://localhost:8000/api/v1"}
STATIC_BASE_URL=${STATIC_BASE_URL:-"http://localhost:8000"}
STATE_FILE=".storage_test_state"

# テスト用ダミー画像の設定
TEST_IMAGE="test_source.jpg"
DOWNLOADED_IMAGE="test_downloaded.jpg"
IMAGE_SIZE_MB=2 # テストするファイルサイズ (MB)

# テスト用ユーザーデータ
TEST_EMAIL="storage_tester@example.com"
TEST_NAME="Storage Tester"
TEST_PASS="password1234"

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

# ハッシュ算出コマンドの選定 (OSによる差異を吸収)
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
USER_ID="$USER_ID"
USER_TOKEN="$USER_TOKEN"
USER_REFRESH="$USER_REFRESH"
FILE_ID="$FILE_ID"
FILE_PATH="$FILE_PATH"
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

# 1. 準備 (サインアップ ＆ テスト用ファイルの自動生成)
setup() {
    echo "=== 【準備】ユーザー作成 ＆ テストファイルの準備 ==="

    # テスト用のランダムなバイナリJPGファイルを生成
    echo "Generating $IMAGE_SIZE_MB MB dummy image file ($TEST_IMAGE)..."
    dd if=/dev/urandom of="$TEST_IMAGE" bs=1M count=$IMAGE_SIZE_MB 2>/dev/null

    echo "Signing up test user ($TEST_EMAIL)..."
    RES=$(curl -s -X POST "$BASE_URL/auth/sign-up" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"name\":\"$TEST_NAME\",\"password\":\"$TEST_PASS\"}")

    SUCCESS=$(echo "$RES" | jq -r '.success')
    if [ "$SUCCESS" != "true" ]; then
        echo "Failed to sign up test user. Response: $RES"
        exit 1
    fi

    USER_TOKEN=$(echo "$RES" | jq -r '.accessToken')
    USER_REFRESH=$(echo "$RES" | jq -r '.refreshToken')
    USER_ID=$(echo "$RES" | jq -r '.user.id')

    echo "  -> Success! User ID: $USER_ID"

    save_state
    echo "=> 準備完了。状態を $STATE_FILE に保存しました。"
    echo ""
}

# 2. アップロードテスト (生のボディストリーム送信)
run_upload_test() {
    load_state
    echo "=== 【テスト実行】ストリームによるファイルアップロード ==="

    if [ ! -f "$TEST_IMAGE" ]; then
        echo "Error: テスト用ソースファイル ($TEST_IMAGE) が見つかりません。"
        exit 1
    fi

    # メタデータの算出
    FILE_NAME="$TEST_IMAGE"
    MIME_TYPE="image/jpeg"
    FILE_SIZE=$(wc -c < "$TEST_IMAGE" | tr -d ' ')

    echo "Uploading file via Stream (Size: $FILE_SIZE bytes)..."

    # --data-binary と追加ヘッダーによって、FormDataでラップせずに
    # Honoの c.req.raw.body（ReadableStream）へパケットを直通させる
    RES_UPLOAD=$(curl -s -X POST "$BASE_URL/file-storage/upload" \
        -H "Authorization: Bearer $USER_TOKEN" \
        -H "x-file-name: $FILE_NAME" \
        -H "x-file-type: $MIME_TYPE" \
        -H "content-length: $FILE_SIZE" \
        -H "x-visibility: public" \
        --data-binary @"$TEST_IMAGE")

    UPLOAD_SUCCESS=$(echo "$RES_UPLOAD" | jq -r '.success')

    if [ "$UPLOAD_SUCCESS" != "true" ]; then
        echo "❌ Upload Failed. Response: $RES_UPLOAD"
        exit 1
    fi

    FILE_ID=$(echo "$RES_UPLOAD" | jq -r '.fileId')
    FILE_PATH=$(echo "$RES_UPLOAD" | jq -r '.filePath')

    echo "  -> 🎉 Upload Success!"
    echo "  -> Returned File ID  : $FILE_ID"
    echo "  -> Returned File Path: $FILE_PATH"

    save_state
    echo ""
}

# 3. ダウンロードテスト (静的コンテンツの配信 ＆ 同一性検証)
run_download_test() {
    load_state
    echo "=== 【テスト実行】静的配信ファイルのストリームダウンロード ==="

    if [ -z "$FILE_PATH" ] || [ "$FILE_PATH" = "null" ]; then
        echo "Error: ダウンロード対象の filePath が状態ファイルに記録されていません。"
        exit 1
    fi

    # API仕様がフルURLか相対パスかによって処理を分岐
    TARGET_URL="$FILE_PATH"
    if [[ "$FILE_PATH" != http* ]]; then
        TARGET_URL="${STATIC_BASE_URL}${FILE_PATH}"
    fi

    echo "Downloading from: $TARGET_URL"

    # --no-buffer によって、curlの内部バッファを無効化し
    # Honoから送られてくるチャンク（パケット単位）の受信を強制的に再現する
    HTTP_STATUS=$(curl -s -w "%{http_code}" --no-buffer -o "$DOWNLOADED_IMAGE" "$TARGET_URL")

    if [ "$HTTP_STATUS" -ne 200 ]; then
        echo "❌ Download Failed. HTTP Status: $HTTP_STATUS"
        exit 1
    fi
    echo "  -> 🎉 Download Success (HTTP 200)."

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
    echo ""
}

# 4. 後処理 (ログアウト ＆ ユーザー削除 ＆ テストファイルクリーンアップ)
cleanup() {
    # 状態ファイルがあれば読み込む（途中で失敗した場合も極力消すためオプショナルに）
    if [ -f "$STATE_FILE" ]; then
        source "$STATE_FILE"
    fi

    echo "=== 【後処理】ログアウト、ユーザー削除、クリーンアップ ==="

    if [ -n "$USER_TOKEN" ]; then
        echo "Logging out user..."
        curl -s -X POST "$BASE_URL/auth/sign-out" \
            -H "Authorization: Bearer $USER_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{\"refreshToken\":\"$USER_REFRESH\"}" > /dev/null
    fi

    if [ -n "$USER_ID" ] && [ -n "$USER_TOKEN" ]; then
        echo "Deleting test user account..."
        curl -s -X DELETE "$BASE_URL/users/$USER_ID" \
            -H "Authorization: Bearer $USER_TOKEN" > /dev/null
    fi

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
    cleanup)
        cleanup
        ;;
    all)
        setup
        run_upload_test
        run_download_test
        cleanup
        ;;
    *)
        echo "使用方法: $0 {setup|upload|download|cleanup|all}"
        echo "  setup    : 準備（アカウント作成とダミーファイルの生成）"
        echo "  upload   : テスト実行（ストリームバイナリアップロードのテスト）"
        echo "  download : テスト実行（静的配信ファイルの取得とハッシュ検証）"
        echo "  cleanup  : 後処理（アカウント削除、一時ファイルのクリーンアップ）"
        echo "  all      : 全ステップを連続で一括実行"
        exit 1
        ;;
esac
