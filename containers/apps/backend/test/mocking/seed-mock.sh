#!/bin/bash
set -e

echo "🚀 モックデータのシード処理を開始します..."

# ==========================================
# 設定
# ==========================================
BASE_URL=${BASE_URL:-"https://api.tracen.local/api/v1"}
API_KEY=${MASTER_API_KEY:-"tracen_master_api_key"}
DEFAULT_PASSWORD="password1234"

for cmd in jq curl; do
    if ! command -v $cmd &> /dev/null; then
        echo "Error: $cmd がインストールされていません。"
        exit 1
    fi
done

MOCK_PDF_CONTENT="%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj
4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
5 0 obj<</Length 62>>stream
BT /F1 24 Tf 20 100 Td (Mock PDF Document) Tj ET
endstream
endobj
xref
0 6
0000000000 65535 f
trailer<</Size 6/Root 1 0 R>>
startxref
0
%%EOF"

# 状態保存用（連想配列の代わりにevalを使用するため、特殊文字を含まないキーのみとする）
# USER_TOKEN_<key>, USER_ID_<key>, FACE_ID_<key>
function set_val() { eval "$1=\"$2\""; }
function get_val() { eval "echo \$$1"; }

# 画像キャッシュ用
function set_img_cache() { eval "IMG_CACHE_${1}=\"$2\""; }
function get_img_cache() { eval "echo \$IMG_CACHE_${1}"; }

# ==========================================
# ヘルパー関数
# ==========================================
upload_image_from_url() {
    local url="$1"
    local token="$2"
    
    # 簡易URLハッシュ化 (キャッシュ用)
    local hash
    hash=$(echo -n "$url" | md5 2>/dev/null || echo -n "$url" | md5sum | awk '{print $1}')
    local cached
    cached=$(get_img_cache "$hash")
    if [ -n "$cached" ]; then
        echo "$cached"
        return
    fi
    
    local tmp_img="/tmp/mock_img_${hash}.jpg"
    curl -s -L -o "$tmp_img" "$url"
    if [ ! -s "$tmp_img" ]; then
        echo >&2 "Error: Failed to download image from $url"
        return
    fi
    
    local file_size
    file_size=$(wc -c < "$tmp_img" | tr -d ' ')
    
    local res
    res=$(curl -s -X POST "${BASE_URL}/file-storage/upload" \
        -H "Authorization: Bearer ${token}" \
        -H "x-file-name: image.jpg" \
        -H "x-file-type: image/jpeg" \
        -H "content-length: ${file_size}" \
        -H "x-visibility: public" \
        --data-binary @"$tmp_img")
        
    local success
    success=$(echo "$res" | jq -r '.success')
    if [ "$success" = "true" ]; then
        local file_id
        file_id=$(echo "$res" | jq -r '.data.fileId')
        set_img_cache "$hash" "$file_id"
        echo "$file_id"
    else
        echo >&2 "Error uploading image: $res"
    fi
}

upload_mock_pdf() {
    local token="$1"
    local tmp_pdf="/tmp/mock_doc_$RANDOM.pdf"
    echo "$MOCK_PDF_CONTENT" > "$tmp_pdf"
    
    local file_size
    file_size=$(wc -c < "$tmp_pdf" | tr -d ' ')
    
    local res
    res=$(curl -s -X POST "${BASE_URL}/file-storage/upload" \
        -H "Authorization: Bearer ${token}" \
        -H "x-file-name: document.pdf" \
        -H "x-file-type: application/pdf" \
        -H "content-length: ${file_size}" \
        -H "x-visibility: public" \
        --data-binary @"$tmp_pdf")
        
    local success
    success=$(echo "$res" | jq -r '.success')
    if [ "$success" = "true" ]; then
        echo "$res" | jq -r '.data.fileId'
    else
        echo >&2 "Error uploading pdf: $res"
    fi
}

# ==========================================
# データ定義 (JSON)
# ==========================================
MOCK_JSON=$(cat <<'EOF'
{
  "users": [
    { "key": "mainUser", "name": "開発 太郎", "avatarUrl": "https://i.pravatar.cc/150?u=mock-main-user" },
    { "key": "friendAccepted1", "name": "佐藤 花子", "avatarUrl": "https://i.pravatar.cc/150?u=mock-friend-accepted-1" },
    { "key": "friendAccepted2", "name": "鈴木 一郎", "avatarUrl": "https://i.pravatar.cc/150?u=mock-friend-accepted-2" },
    { "key": "friendOutgoing", "name": "田中 美咲", "avatarUrl": "https://i.pravatar.cc/150?u=mock-friend-outgoing" },
    { "key": "friendIncoming", "name": "高橋 健太", "avatarUrl": "https://i.pravatar.cc/150?u=mock-friend-incoming" },
    { "key": "unrelatedUser", "name": "渡辺 さくら", "avatarUrl": "https://i.pravatar.cc/150?u=mock-unrelated-user" }
  ],
  "friendships": [
    { "requesterKey": "mainUser", "addresseeKey": "friendAccepted1", "accept": true },
    { "requesterKey": "mainUser", "addresseeKey": "friendAccepted2", "accept": true },
    { "requesterKey": "mainUser", "addresseeKey": "friendOutgoing", "accept": false },
    { "requesterKey": "friendIncoming", "addresseeKey": "mainUser", "accept": false }
  ],
  "faces": [
    { "key": "memoriesFace", "userKey": "mainUser", "name": "開発ログ", "emoji": "💻", "description": "日々の開発の記録。", "visibility": "public" },
    { "key": "mainExtra1", "userKey": "mainUser", "name": "筋トレ記録", "emoji": "💪", "visibility": "public", "imageUrl": "https://picsum.photos/seed/mock-strength/600/400" },
    { "key": "mainExtra2", "userKey": "mainUser", "name": "登山日記", "emoji": "⛰️", "visibility": "public", "imageUrl": "https://picsum.photos/seed/mock-hiking/600/400" },
    { "key": "friendAccepted1Books", "userKey": "friendAccepted1", "name": "読書記録", "emoji": "📚", "description": "読んだ本の感想など", "visibility": "public", "imageUrl": "https://picsum.photos/seed/mock-books/600/400" },
    { "key": "friendAccepted1Cafe", "userKey": "friendAccepted1", "name": "カフェ巡り", "emoji": "☕", "description": "カフェの記録", "visibility": "public" },
    { "key": "friendAccepted2Game", "userKey": "friendAccepted2", "name": "ゲーム記録", "emoji": "🎮", "description": "進捗ログ", "visibility": "public", "imageUrl": "https://picsum.photos/seed/mock-game/600/400" },
    { "key": "friendOutgoingCooking", "userKey": "friendOutgoing", "name": "料理日記", "emoji": "🍳", "description": "料理のメモ", "visibility": "public", "imageUrl": "https://picsum.photos/seed/mock-cooking/600/400" },
    { "key": "friendIncomingTech", "userKey": "friendIncoming", "name": "技術メモ", "emoji": "💡", "description": "TIL", "visibility": "public" },
    { "key": "unrelatedDiary", "userKey": "unrelatedUser", "name": "今日の出来事", "emoji": "📝", "description": "日々の出来事", "visibility": "public" }
  ],
  "seeds": [
    { "faceKey": "memoriesFace", "body": "PostgreSQLのインデックス周りを調べて、クエリが早くなった。" },
    { "faceKey": "memoriesFace", "body": "ずっと詰まっていたバグの原因が、タイムゾーンの扱い間違いだったと判明した。" },
    { "faceKey": "memoriesFace", "body": "新しいライブラリを試してみた。思ったより導入が楽だった。" },
    { "faceKey": "friendAccepted1Books", "body": "『三体』読了。宇宙の広大さにめまいがした。ハードSFはやっぱり面白い。" },
    { "faceKey": "friendAccepted1Cafe", "body": "駅前に新しくできたカフェへ。豆から挽いてくれる丁寧さが好印象。", "attachments": [{ "kind": "photo", "url": "https://picsum.photos/seed/mock-cafe1/600/400" }] },
    { "faceKey": "friendAccepted2Game", "body": "念願のRPGをついにクリア。エンディングで泣いた。", "attachments": [{ "kind": "photo", "url": "https://picsum.photos/seed/mock-game1/600/400" }] },
    { "faceKey": "friendOutgoingCooking", "body": "週末は作り置き。今週は常備菜を5品ほど仕込んだ。", "attachments": [{ "kind": "photo", "url": "https://picsum.photos/seed/mock-cooking1/600/400" }] },
    { "faceKey": "friendIncomingTech", "body": "社内勉強会の資料をPDFでまとめて共有した。", "attachments": [{ "kind": "pdf" }] },
    { "faceKey": "unrelatedDiary", "body": "今日は近所を散歩した。金木犀の香りがした。" }
  ]
}
EOF
)

# ==========================================
# メイン処理
# ==========================================

echo ""
echo "👤 [1/5] ユーザー登録処理中..."
user_keys=$(echo "$MOCK_JSON" | jq -r '.users[].key')
for key in $user_keys; do
    name=$(echo "$MOCK_JSON" | jq -r ".users[] | select(.key==\"$key\") | .name")
    email=$(echo "$key" | tr '[:upper:]' '[:lower:]')"@example.com"
    avatarUrl=$(echo "$MOCK_JSON" | jq -r ".users[] | select(.key==\"$key\") | .avatarUrl")
    
    res=$(curl -s -X POST "${BASE_URL}/auth/sign-up" \
        -H "X-API-Key: ${API_KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"name\":\"$name\",\"password\":\"$DEFAULT_PASSWORD\"}")
        
    success=$(echo "$res" | jq -r '.success')
    if [ "$success" = "true" ]; then
        token=$(echo "$res" | jq -r '.data.accessToken')
        uid=$(echo "$res" | jq -r '.data.user.id')
        set_val "USER_TOKEN_${key}" "$token"
        set_val "USER_ID_${key}" "$uid"
        
        # アバターアップロード
        if [ "$avatarUrl" != "null" ]; then
            file_id=$(upload_image_from_url "$avatarUrl" "$token")
            if [ -n "$file_id" ]; then
                curl -s -X PUT "${BASE_URL}/user-profile/${uid}" \
                    -H "Authorization: Bearer ${token}" \
                    -H "Content-Type: application/json" \
                    -d "{\"name\":\"$name\",\"avatarFileId\":\"$file_id\",\"badge\":null}" > /dev/null
            fi
        fi
        echo "  ✅ ユーザー作成完了: $name (ID: $uid)"
    else
        echo "  ❌ ユーザー作成失敗 ($name): $res"
    fi
done

echo ""
echo "🤝 [2/5] フレンド関係構築中..."
len=$(echo "$MOCK_JSON" | jq '.friendships | length')
for ((i=0; i<$len; i++)); do
    reqKey=$(echo "$MOCK_JSON" | jq -r ".friendships[$i].requesterKey")
    addKey=$(echo "$MOCK_JSON" | jq -r ".friendships[$i].addresseeKey")
    accept=$(echo "$MOCK_JSON" | jq -r ".friendships[$i].accept")
    
    reqToken=$(get_val "USER_TOKEN_${reqKey}")
    addId=$(get_val "USER_ID_${addKey}")
    addToken=$(get_val "USER_TOKEN_${addKey}")
    
    if [ -z "$reqToken" ] || [ -z "$addId" ]; then
        continue
    fi
    
    res=$(curl -s -X POST "${BASE_URL}/friendships/requests" \
        -H "Authorization: Bearer ${reqToken}" \
        -H "Content-Type: application/json" \
        -d "{\"addresseeId\":\"$addId\"}")
        
    success=$(echo "$res" | jq -r '.success')
    if [ "$success" = "true" ]; then
        reqId=$(echo "$res" | jq -r '.data.friendship.id')
        if [ "$accept" = "true" ]; then
            curl -s -X PATCH "${BASE_URL}/friendships/requests/${reqId}/accept" \
                -H "Authorization: Bearer ${addToken}" > /dev/null
            echo "  ✅ フレンド関係作成完了: $reqKey -> $addKey (承認済み)"
        else
            echo "  ✅ フレンド関係作成完了: $reqKey -> $addKey (申請中)"
        fi
    else
        echo "  ❌ フレンド申請失敗 ($reqKey -> $addKey): $res"
    fi
done

echo ""
echo "🎭 [3/5] Face 登録処理中..."
len=$(echo "$MOCK_JSON" | jq '.faces | length')
for ((i=0; i<$len; i++)); do
    f_key=$(echo "$MOCK_JSON" | jq -r ".faces[$i].key")
    u_key=$(echo "$MOCK_JSON" | jq -r ".faces[$i].userKey")
    name=$(echo "$MOCK_JSON" | jq -r ".faces[$i].name")
    emoji=$(echo "$MOCK_JSON" | jq -r ".faces[$i].emoji")
    desc=$(echo "$MOCK_JSON" | jq -r ".faces[$i].description")
    vis=$(echo "$MOCK_JSON" | jq -r ".faces[$i].visibility")
    img_url=$(echo "$MOCK_JSON" | jq -r ".faces[$i].imageUrl")
    
    token=$(get_val "USER_TOKEN_${u_key}")
    if [ -z "$token" ]; then
        continue
    fi
    
    img_id="null"
    if [ "$img_url" != "null" ]; then
        uploaded=$(upload_image_from_url "$img_url" "$token")
        if [ -n "$uploaded" ]; then
            img_id="\"$uploaded\""
        fi
    fi
    
    [ "$emoji" = "null" ] || emoji="\"$emoji\""
    [ "$desc" = "null" ] || desc="\"$desc\""
    
    payload="{\"name\":\"$name\",\"emoji\":$emoji,\"description\":$desc,\"visibility\":\"$vis\",\"imageId\":$img_id}"
    
    res=$(curl -s -X POST "${BASE_URL}/faces" \
        -H "Authorization: Bearer ${token}" \
        -H "Content-Type: application/json" \
        -d "$payload")
        
    success=$(echo "$res" | jq -r '.success')
    if [ "$success" = "true" ]; then
        faceId=$(echo "$res" | jq -r '.data.face.id')
        set_val "FACE_ID_${f_key}" "$faceId"
        echo "  ✅ Face作成完了: $name (ID: $faceId)"
    else
        echo "  ❌ Face作成失敗 ($name): $res"
    fi
done

# ページネーションテスト用のダミーSeedを40件自動追加
MOCK_JSON=$(echo "$MOCK_JSON" | jq '.seeds += [range(1; 41) | {"faceKey": "memoriesFace", "body": "ページネーション用ダミー投稿 \(. | tostring)件目。テスト用の自動生成テキストです。"}]')

echo ""
echo "🌱 [4/5] Seed 登録処理中..."
seed_count=0
len=$(echo "$MOCK_JSON" | jq '.seeds | length')
for ((i=0; i<$len; i++)); do
    f_key=$(echo "$MOCK_JSON" | jq -r ".seeds[$i].faceKey")
    body=$(echo "$MOCK_JSON" | jq -r ".seeds[$i].body")
    
    faceId=$(get_val "FACE_ID_${f_key}")
    u_key=$(echo "$MOCK_JSON" | jq -r ".faces[] | select(.key==\"$f_key\") | .userKey")
    token=$(get_val "USER_TOKEN_${u_key}")
    
    if [ -z "$faceId" ] || [ -z "$token" ]; then
        continue
    fi
    
    # 添付ファイル処理
    imageIds="[]"
    att_len=$(echo "$MOCK_JSON" | jq ".seeds[$i].attachments | length")
    if [ "$att_len" -gt 0 ]; then
        imageIds="["
        for ((j=0; j<$att_len; j++)); do
            kind=$(echo "$MOCK_JSON" | jq -r ".seeds[$i].attachments[$j].kind")
            if [ "$kind" = "photo" ]; then
                url=$(echo "$MOCK_JSON" | jq -r ".seeds[$i].attachments[$j].url")
                file_id=$(upload_image_from_url "$url" "$token")
                [ -n "$file_id" ] && imageIds="${imageIds}\"${file_id}\","
            elif [ "$kind" = "pdf" ]; then
                file_id=$(upload_mock_pdf "$token")
                [ -n "$file_id" ] && imageIds="${imageIds}\"${file_id}\","
            fi
        done
        imageIds="${imageIds%,}]"
        [ "$imageIds" = "]" ] && imageIds="[]"
    fi
    
    # エスケープ処理
    body_esc=$(echo "$body" | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')
    
    payload="{\"faceId\":\"$faceId\",\"body\":\"$body_esc\",\"imageIds\":$imageIds}"
    
    res=$(curl -s -X POST "${BASE_URL}/seeds" \
        -H "Authorization: Bearer ${token}" \
        -H "Content-Type: application/json" \
        -d "$payload")
        
    success=$(echo "$res" | jq -r '.success')
    if [ "$success" = "true" ]; then
        seed_count=$((seed_count + 1))
    else
        echo "  ❌ Seed作成失敗 ($f_key): $res"
    fi
done
echo "  ✅ Seed作成完了: ${seed_count}件"

echo ""
echo "🔑 [5/5] ログインに使用可能なテストユーザー情報:"
for key in $user_keys; do
    name=$(echo "$MOCK_JSON" | jq -r ".users[] | select(.key==\"$key\") | .name")
    email=$(echo "$key" | tr '[:upper:]' '[:lower:]')"@example.com"
    echo "  - 名前: $name"
    echo "    メール: $email"
    echo "    パスワード: $DEFAULT_PASSWORD"
done

echo ""
echo "🎉 すべてのシードデータ投入処理が完了しました！"
echo "ℹ️  実行時点の日時でAPIによりSeedが作成されました。"
