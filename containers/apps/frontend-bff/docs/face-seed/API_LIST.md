## FaceAPI一覧

| #   | メソッド/パス           | やること                               | リクエスト                                                            | レスポンス(成功時)                                                                    |
| --- | ----------------------- | -------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 1   | `POST /faces`           | Faceを新規作成する                     | `{ name, emoji, description, imageId, visibility }`                   | `201` + 作成された `face`                                                             |
| 2   | `PUT /faces/:faceId`    | Faceを更新する(全項目を送信し直す方式) | パスに `faceId` + `{ name, emoji, description, imageId, visibility }` | `200` + `{ success: true }`                                                           |
| 3   | `DELETE /faces/:faceId` | Faceを削除する                         | パスに `faceId`                                                       | `204 No Content`                                                                      |
| 4   | `GET /faces`            | Face一覧を検索・取得する               | クエリ: `q`, `userId`, `sortBy`, `order`, `limit`, `cursor`           | `200` + `faceSummaries[]`(各Faceに `lastPostedAt`/`numberOfPosts` 込み)、`nextCursor` |

## SeedAPI一覧

| #   | メソッド/パス           | やること                               | リクエスト                                                                        | レスポンス(成功時)                                        |
| --- | ----------------------- | -------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 1   | `POST /seeds`           | Seedを新規投稿する                     | `{ faceId, body, imageIds }`                                                      | `201` + 作成された `seed`                                 |
| 2   | `PUT /seeds/:seedId`    | Seedを更新する(全項目を送信し直す方式) | パスに `seedId` + `{ body, imageIds }`                                            | `200` + `{ success: true }`                               |
| 3   | `DELETE /seeds/:seedId` | Seedを削除する                         | パスに `seedId`                                                                   | `204 No Content`                                          |
| 4   | `GET /seeds`            | Seed一覧を検索・取得する               | クエリ: `q`, `faceId`, `userId`, `fromDate`, `toDate`, `order`, `limit`, `cursor` | `200` + `seeds[]`(本文・画像込みのSeed本体)、`nextCursor` |

## 初学者向けポイント

- **更新は「全項目を送信し直す」方式**: `PUT /faces/:faceId` / `PUT /seeds/:seedId` はどちらも一部項目だけの部分更新ではなく、変更しない項目も含めて全部のフィールドを送る必要がある(`PATCH` ではなく `PUT` になっているのはこのため)
- **画像は「事前アップロード済みファイルのID」を渡す方式**: 画像そのもの(バイナリ)を直接送るのではなく、`file-storage` 機能で先にアップロードしておいたファイルの `imageId`(Faceは1枚だけ、Seedは `imageIds` で複数枚)を指定する2段階の流れになっている
- **Faceの公開範囲は2種類だけ**: `visibility` は `public`(公開)/`private`(非公開)のどちらか。フレンドかどうかで見え方が変わるような複雑な権限制御は今のところ無い
- **ページネーションは「カーソル方式」**: フレンドAPIと同じく、`limit`(件数)と `cursor`(前回取得した最後のIDのようなもの)を渡して続きから取得する形式。ページ番号ではない点に注意
- **一覧系(4)は検索・絞り込みが豊富**: Face一覧は `q`(キーワード検索)・`userId`(投稿者で絞り込み)・`sortBy`/`order`(並び替え)、Seed一覧はさらに `faceId`(所属Faceで絞り込み)・`fromDate`/`toDate`(期間で絞り込み)が使える
- **Face一覧だけ集計情報が付いてくる**: `faceSummaries[]` の各要素には、Face本体に加えて `lastPostedAt`(最後にSeedが投稿された日時)・`numberOfPosts`(投稿数)が付与されている。Seed一覧の方は集計無しでSeed本体がそのまま並ぶだけ
- **エラーハンドリング**: 403(自分以外のFace/Seedを更新・削除しようとした場合)、404(指定したFace/Seedが存在しない)が代表的。認証は共通で必須(未ログインは401)

---
