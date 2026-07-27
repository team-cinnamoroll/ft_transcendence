# API仕様書

## 共通仕様

- **ベースURL**: `http://{host}:{port}/api/v1`
- **認証**: 全てのエンドポイントでHTTPヘッダーにアクセストークンが必要です。
- `Authorization: Bearer <AccessToken>`

- **Content-Type**: リクエストボディを持つものは `application/json` を指定します。

---

## 1. ユーザープロフィール API

### 1.1 プロフィール一括取得（バルククエリー）

指定した複数のユーザーIDのプロフィールと、リクエスト主からの関係性（Relationship）を一度に取得します。

- **メソッド / エンドポイント**
  `GET /user-profile/profiles`
- **クエリパラメータ**
- `ids` (必須): 取得したいユーザーID（UUID）をカンマ区切りで指定。
- **制限**: 1回のリクエストで指定できるIDは **最大100件** まで。

**リクエスト実装例**

```bash
curl -X GET "http://localhost:8000/api/v1/user-profile/profiles?ids=uuid-1,uuid-2" \
  -H "Authorization: Bearer <AccessToken>"

```

- **レスポンスパターン**
- **200 OK**: 取得成功
- **400 Bad Request**: 取得件数が上限（100件）を超過している場合など

**レスポンス例 (200 OK)**

```json
{
  "success": true,
  "data": {
    "profileMap": {
      "uuid-1": {
        "id": "uuid-1",
        "name": "User One",
        "avatar": { "id": "img1", "url": "https://..." },
        "badge": null,
        "relationship": {
          "status": "FRIEND",
          "friendshipId": "friendship-uuid"
        }
      },
      "uuid-2": null // 存在しないIDの場合はnullが返却される
    }
  }
}
```

> **※ Relationship Status の種類**:
> `SELF` (自分), `NONE` (無関係), `PENDING_OUTGOING` (申請中), `PENDING_INCOMING` (申請され中), `FRIEND` (フレンド), `BLOCKED_BY` (相手に拒否された), `BLOCKED` (自分が拒否した)

---

## 2. フレンド API

### 2.1 フレンド申請（送信）

特定のアカウントに対してフレンド申請を送信します。

- **メソッド / エンドポイント**
  `POST /friendships/requests`
- **リクエストボディ**
- `addresseeId` (必須, UUID): 申請先のユーザーID

**リクエスト実装例**

```bash
curl -X POST "http://localhost:8000/api/v1/friendships/requests" \
  -H "Authorization: Bearer <AccessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "addresseeId": "target-user-uuid"
  }'

```

- **レスポンスパターン**
- **201 Created**: 申請成功（ステータスは `PENDING` になります）
- **400 Bad Request**: 自身への申請など無効なリクエスト
- **409 Conflict**: 既に申請済みの場合など

**レスポンス例 (201 Created)**

```json
{
  "success": true,
  "data": {
    "friendship": {
      "id": "friendship-uuid",
      "requesterId": "my-user-uuid",
      "addresseeId": "target-user-uuid",
      "status": "PENDING",
      "createdAt": "2026-07-26T15:28:15.217Z",
      "updatedAt": "2026-07-26T15:28:15.217Z"
    }
  }
}
```

### 2.2 フレンド申請の承認

受信したフレンド申請を承認し、フレンド状態にします。

- **メソッド / エンドポイント**
  `PATCH /friendships/requests/:friendshipId/accept`

**リクエスト実装例**

```bash
curl -X PATCH "http://localhost:8000/api/v1/friendships/requests/friendship-uuid/accept" \
  -H "Authorization: Bearer <AccessToken>"

```

- **レスポンスパターン**
- **200 OK**: 承認成功（ステータスは `ACCEPTED` になります）
- **409 Conflict**: 既に承認済みの場合など

**レスポンス例 (200 OK)**

```json
{
  "success": true,
  "data": {
    "friendship": {
      "id": "friendship-uuid",
      "requesterId": "sender-user-uuid",
      "addresseeId": "my-user-uuid",
      "status": "ACCEPTED",
      "createdAt": "2026-07-26T15:28:15.217Z",
      "updatedAt": "2026-07-26T15:28:41.104Z"
    }
  }
}
```

### 2.3 フレンド申請の取り消し / 拒否 (ブロック)

送信した申請の取り消し、または受信した申請の拒否を行います。

- **メソッド / エンドポイント**
  `DELETE /friendships/requests/:friendshipId`

**リクエスト実装例**

```bash
curl -X DELETE "http://localhost:8000/api/v1/friendships/requests/friendship-uuid" \
  -H "Authorization: Bearer <AccessToken>"

```

- **レスポンスパターン**
- **200 OK**: 処理成功
- **404 Not Found**: 既に削除されている、または存在しない場合

- **挙動の仕様**
- **送信者（取り消し）**: 即座にレコードが削除され、レスポンスの `friendship` は `null` になります。
- **受信者（拒否）**: 1回目はステータスが `BLOCKED` に変更され拒否状態として記録されます。もう一度同じリクエストを送ると完全に削除され `null` が返却されます。

**レスポンス例 (200 OK - 受信者が1回目の拒否をした場合)**

```json
{
  "success": true,
  "data": {
    "friendship": {
      "id": "friendship-uuid",
      "requesterId": "sender-user-uuid",
      "addresseeId": "my-user-uuid",
      "status": "BLOCKED",
      "createdAt": "2026-07-26T15:27:08.830Z",
      "updatedAt": "2026-07-26T15:27:38.732Z"
    }
  }
}
```

**レスポンス例 (200 OK - 送信者が取り消し、または受信者が完全に削除した場合)**

```json
{
  "success": true,
  "data": {
    "friendship": null
  }
}
```

### 2.4 フレンド申請一覧（送信・受信）取得

送信中、または受信中のフレンド申請をページネーションで一覧取得します。

- **メソッド / エンドポイント**
  `GET /friendships/requests`
- **クエリパラメータ**
- `type` (必須): `incoming`（受信一覧） または `outgoing`（送信一覧）
- `limit` (必須): 取得件数。**1 〜 100** の範囲で指定。
- `cursor` (任意): 次のページを取得するためのカーソルトークン。

**リクエスト実装例 (受信一覧の初回取得)**

```bash
curl -X GET "http://localhost:8000/api/v1/friendships/requests?type=incoming&limit=20" \
  -H "Authorization: Bearer <AccessToken>"

```

**リクエスト実装例 (次ページの取得)**

```bash
curl -X GET "http://localhost:8000/api/v1/friendships/requests?type=incoming&limit=20&cursor=next-cursor-string" \
  -H "Authorization: Bearer <AccessToken>"

```

- **レスポンスパターン**
- **200 OK**: 取得成功
- **400 Bad Request**: limitの値が不正な場合など

**レスポンス例 (200 OK)**

```json
{
  "success": true,
  "data": {
    "pendingRequests": [
      {
        "requestId": "friendship-uuid",
        "userProfile": {
          "id": "sender-user-uuid",
          "name": "User One",
          "avatar": null,
          "badge": null
        },
        "requestedAt": "2026-07-26T15:51:33.021Z"
      }
    ],
    "nextCursor": "cursor_string_or_null"
  }
}
```

### 2.5 フレンド一覧取得

現在フレンド状態にあるユーザーをページネーションで一覧取得します。

- **メソッド / エンドポイント**
  `GET /friendships`
- **クエリパラメータ**
- `limit` (必須): 取得件数。**1 〜 100** の範囲で指定。
- `cursor` (任意): 次のページを取得するためのカーソルトークン。

**リクエスト実装例**

```bash
curl -X GET "http://localhost:8000/api/v1/friendships?limit=50" \
  -H "Authorization: Bearer <AccessToken>"

```

- **レスポンスパターン**
- **200 OK**: 取得成功
- **400 Bad Request**: limitの値が不正な場合など

**レスポンス例 (200 OK)**

```json
{
  "success": true,
  "data": {
    "friendships": [
      {
        "friendshipId": "friendship-uuid",
        "friendProfile": {
          "id": "friend-user-uuid",
          "name": "User Two",
          "avatar": null,
          "badge": null
        },
        "becameFriendsAt": "2026-07-26T15:28:41.104Z",
        "isOnline": true
      }
    ],
    "nextCursor": null
  }
}
```

### 2.6 フレンド解消

指定したユーザーとのフレンド関係を解消（削除）します。

- **メソッド / エンドポイント**
  `DELETE /friendships/:friendId`
- **パスパラメータ**
- `friendId`: 解消したい相手の **ユーザーID**（※friendshipIdではない点に注意）

**リクエスト実装例**

```bash
curl -X DELETE "http://localhost:8000/api/v1/friendships/target-user-uuid" \
  -H "Authorization: Bearer <AccessToken>"

```

- **レスポンスパターン**
- **204 No Content**: 解消成功（レスポンスボディは空）

---

## 3. プレゼンス (オンライン状態) API

### 3.1 ハートビート送信

クライアントが現在オンラインであることをサーバーに通知します。このAPIを定期的に実行することで、フレンド一覧などの `isOnline` ステータスが `true` と判定されます。

- **メソッド / エンドポイント**
  `POST /presence/heartbeat`

**リクエスト実装例**

```bash
curl -X POST "http://localhost:8000/api/v1/presence/heartbeat" \
  -H "Authorization: Bearer <AccessToken>" \
  -H "Content-Type: application/json" \
  -d '{}'

```

- **レスポンスパターン**
- **200 OK**: 更新成功

**レスポンス例 (200 OK)**

```json
{
  "success": true
}
```
