# Face & Seed API ドキュメント

## Face & Seed 仕様

- Faceの最大件数指定はありません。
- Seedの最大件数指定はありません。
- Seedの投稿は、Faceに紐づくFaceIDを指定する必要があります。
- Faceを削除すると、紐づくSeedもすべて削除されます（Cascade削除）。
- Userを削除すると、紐づくFaceとSeedもすべて削除されます（Cascade削除）。

---

## エンドポイント設計と認証ポリシー

FaceとSeedに関する全操作に **JWT認証が必須** になります。

| リソース | メソッド | エンドポイント | JWT認証 | 概要・アクセス制御                                   |
| -------- | -------- | -------------- | ------- | ---------------------------------------------------- |
| **Face** | `GET`    | `/faces?`      | **要**  | 公開フェイス一覧（検索クエリー）                     |
|          | `GET`    | `/faces/:id`   | **要**  | 特定のフェイスを取得                                 |
|          | `POST`   | `/faces`       | **要**  | **自分の**フェイスを作成                             |
|          | `PUT`    | `/faces/:id`   | **要**  | **自分の**フェイスを更新（他人のIDは403/404）        |
|          | `DELETE` | `/faces/:id`   | **要**  | **自分の**フェイスを削除（他人のIDは403/404）        |
| **Seed** | `GET`    | `/seeds?`      | **要**  | 投稿一覧（検索クエリー）                             |
|          | `GET`    | `/seeds/:id`   | **要**  | 特定の投稿を取得                                     |
|          | `POST`   | `/seeds`       | **要**  | 投稿作成（**自分のカテゴリーIDであるか検証が必要**） |
|          | `PUT`    | `/seeds/:id`   | **要**  | 投稿更新（自分の投稿かつ自分のカテゴリーか検証）     |
|          | `DELETE` | `/seeds/:id`   | **要**  | 投稿削除（自分の投稿かつ自分のカテゴリーか検証）     |

---

## 検索クエリーの仕様

- すべてのパラメータはオプションであり、指定しない場合はデフォルト値が適用されます。
- **注意（クエリパラメータの送信ルール）**:
- **特殊文字・日本語の処理**: 日本語や記号が含まれるパラメータは、HTTPリクエストの破綻（`400 Bad Request`）を防ぐため、必ずURLエンコード（Percent-encoding）を行ってください。`curl` コマンドを使用する場合は、`curl -G` と `--data-urlencode` を併用することを推奨します。
- **日時フォーマット（タイムゾーン）**: 日付パラメータ（`fromDate`, `toDate`）は、**ISO 8601 UTC形式（末尾が `Z`）** で指定してください（例: `2026-01-01T00:00:00Z`）。タイムゾーンオフセット表記（`+09:00` など）はバリデーションエラーとなります。

### `/faces?` リクエストパラメータ一覧

| パラメータ名 | 型                      | 例                    | 説明・用途                                                              |
| ------------ | ----------------------- | --------------------- | ----------------------------------------------------------------------- |
| **`q`**      | string                  | `q=React`             | faceタイトル・説明・絵文字に対する全文検索キーワード（要URLエンコード） |
| **`userId`** | string                  | `userId=usr123`       | 作成者フィルタ                                                          |
| **`sortBy`** | string                  | `sortBy=lastpostedAt` | ソート対象キー（`lastpostedAt`, `seedsCount` ）                         |
| **`order`**  | `'asc'` または `'desc'` | `order=desc`          | ソート順                                                                |
| **`limit`**  | number                  | `limit=20`            | 1回の取得件数（省略時は 20、最大 100）                                  |
| **`cursor`** | string                  | `cursor=eyJpZCI6...`  | ページネーション用のカーソル（Base64等でエンコード）                    |

#### リクエスト例

```http
GET /faces?userId=xxx&sortBy=lastpostedAt&limit=100&cursor=xxx

```

### `/seeds?` リクエストパラメータ一覧

- ソートは日付順のみ対応

| パラメータ名                  | 型                      | 例                              | 説明・用途                                            |
| ----------------------------- | ----------------------- | ------------------------------- | ----------------------------------------------------- |
| **`q`**                       | string                  | `q=React`                       | 投稿本文に対する全文検索キーワード（要URLエンコード） |
| **`faceId`**                  | string                  | `faceId=face1`                  | フェイスの指定                                        |
| **`userId`**                  | string                  | `userId=usr123`                 | 作成者フィルタ                                        |
| **`fromDate`** / **`toDate`** | string (ISO 8601 UTC)   | `fromDate=2026-01-01T00:00:00Z` | 期間絞り込み（**末尾 `Z` 形式必須**）                 |
| **`order`**                   | `'asc'` または `'desc'` | `order=desc`                    | ソート順                                              |
| **`limit`**                   | number                  | `limit=20`                      | 1回の取得件数（省略時は 20、最大 100）                |
| **`cursor`**                  | string                  | `cursor=eyJpZCI6...`            | ページネーション用のカーソル（Base64等でエンコード）  |

#### リクエスト例

```http
GET /seeds?faceId=xxx&userId=xxx&fromDate=2026-01-01T00:00:00Z&toDate=2026-12-31T23:59:59Z&limit=100&cursor=xxx

```

---

## ユーザー依存カテゴリー設計における3つの重要ポイント

1. **他人のカテゴリーID指定の防止（セキュリティ）**
   フロントエンドでドロップダウン選択させていても、API直接実行により「ユーザーAがユーザーBの `faceId` を指定して投稿する」ことが可能です。サーバー側（Hono）で `WHERE id = faceId AND user_id = currentUserId` の存在確認を必ず行ってください。
2. **カテゴリー削除時の挙動（データ整合性）**
   ユーザーがカテゴリーを削除した際、そのカテゴリーに紐づいていた投稿をどう扱うかを決めておく必要があります。

- **Nullify**: 投稿の `faceId` を `NULL` に更新し、投稿自体は残す（未分類扱いにする）。
- **Cascade（採用）**: カテゴリー削除時に、属する投稿もすべて削除する。
- **Restrict**: 投稿が1件でも紐づいているカテゴリーは削除不可エラー（`400 Bad Request`）にする。

---

## モックデータの投入

開発環境で初期モックデータを投入するには、以下のコマンドを実行します。

```bash
pnpm --filter @tracen/backend mock:add-seed

```

※ `mocks/` 配下の `users.ts`, `faces.ts`, `seeds.ts` を読み込み、ユーザー作成・画像アップロード・Face作成・Seed作成および最後のログアウト処理を自動で一括実行します。

---

## クエリーを使用した curl コマンド操作例

モック投入後、データの検索や取得を行うための具体的な `curl` コマンド例です。

### 事前準備（認証トークンの設定）

すべてのAPI呼び出しにはJWT認証トークンが必要です。ユーザーでログイン後、取得したアクセストークンを環境変数にセットしてください。

```bash
BASE_URL="http://localhost:8000/api/v1"
TOKEN="your_access_token_here"

```

> **注意**: 日本語や記号（`:` や `+` など）をクエリに含める場合は、`curl -G` と `--data-urlencode` オプションを必ず使用してください。

### 1. Face の取得操作 (`GET /faces`)

#### キーワード検索 + 取得件数制限 (`q`, `limit`)

```bash
curl -s -G "$BASE_URL/faces" \
  --data-urlencode "q=読書" \
  --data-urlencode "limit=10" \
  -H "Authorization: Bearer $TOKEN"

```

#### 特定ユーザーの Face を最終投稿日時の降順で取得 (`userId`, `sortBy`, `order`)

```bash
curl -s -G "$BASE_URL/faces" \
  --data-urlencode "userId=usr123" \
  --data-urlencode "sortBy=lastpostedAt" \
  --data-urlencode "order=desc" \
  -H "Authorization: Bearer $TOKEN"

```

#### ページネーション指定 (`limit`, `cursor`)

```bash
curl -s -G "$BASE_URL/faces" \
  --data-urlencode "limit=5" \
  --data-urlencode "cursor=eyJpZCI6..." \
  -H "Authorization: Bearer $TOKEN"

```

---

### 2. Seed の取得操作 (`GET /seeds`)

#### 特定 Face に紐づく Seed の取得 (`faceId`, `order`)

```bash
curl -s -G "$BASE_URL/seeds" \
  --data-urlencode "faceId=face123" \
  --data-urlencode "order=asc" \
  -H "Authorization: Bearer $TOKEN"

```

#### 期間指定 + キーワード検索 (`fromDate`, `toDate`, `q`)

※日時は必ず **UTC形式（末尾 `Z`）** で指定します。

```bash
curl -s -G "$BASE_URL/seeds" \
  --data-urlencode "q=カフェ" \
  --data-urlencode "fromDate=2026-01-01T00:00:00Z" \
  --data-urlencode "toDate=2026-03-31T23:59:59Z" \
  --data-urlencode "limit=10" \
  -H "Authorization: Bearer $TOKEN"

```
