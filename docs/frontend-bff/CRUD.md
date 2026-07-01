# データ CRUD 実装状況

凡例: ✅ 実装済み / ⚠️ 部分実装 / ❌ 未実装

---

## Face

| CRUD       | Repository                                   | Usecase                                   | Server Action / API / Server Component 直呼び        | UI                                  |
| ---------- | -------------------------------------------- | ----------------------------------------- | -------------------------- | ----------------------------------- |
| **Create** | ✅ `create()`                                | ✅ `createFaceForCurrentUser()`           | ✅ `createFaceAction()`    | ✅ `CreateFaceModal`                |
| **Read**   | ✅ `listByUserId()` `findById()` `listAll()` | ✅ `listFacesByUserId()` `findFaceById()` | ✅ `/api/detail/face/[id]` | ✅ `FacesClient` `FaceDetailClient` |
| **Update** | ✅ `update()` (#215)                         | ✅ `updateFaceForCurrentUser()` (#215)    | ✅ `updateFaceAction()` (#215) | ✅ `EditFaceModal` (#215)       |
| **Delete** | ✅ `delete()` (#215)                         | ✅ `deleteFaceForCurrentUser()` (#215)    | ✅ `deleteFaceAction()` (#215) | ✅ `FacesClient` (#215)         |

---

## Seed

| CRUD       | Repository                                      | Usecase                                      | Server Action / API / Server Component 直呼び        | UI                                       |
| ---------- | ----------------------------------------------- | -------------------------------------------- | -------------------------- | ---------------------------------------- |
| **Create** | ✅ `create()` (#214)                            | ✅ `createSeedForCurrentUser()` (#214)       | ✅ `createSeedAction()` (#214) | ✅ `PostModal` (#214)               |
| **Read**   | ✅ `findById()` `listAll()` `listByFaceId()` 他 | ✅ `findSeedById()` `listSeedsByFaceId()` 他 | ✅ `/api/detail/seed/[id]` | ✅ `SeedFeed` `SeedDetailPage`           |
| **Update** | ✅ `update()` (#216)                            | ✅ `updateSeedForCurrentUser()` (#216)       | ✅ `updateSeedAction()` (#216) | ✅ `EditSeedModal` (#216)           |
| **Delete** | ✅ `delete()` (#216)                            | ✅ `deleteSeedForCurrentUser()` (#216)       | ✅ `deleteSeedAction()` (#216) | ✅ `HomeClient` (#216)              |

---

## Notification

| CRUD       | Repository     | Usecase                  | Server Action / API / Server Component 直呼び           | UI                    |
| ---------- | -------------- | ------------------------ | ----------------------------- | --------------------- |
| **Create** | —              | —                        | —                             | —                     |
| **Read**   | ✅ `listAll()` | ✅ `listNotifications()` | ✅（Server Component 直呼び） | ✅ `NotificationList` |
| **Update** | —              | —                        | —                             | —                     |
| **Delete** | —              | —                        | —                             | —                     |

- Create: フォロー・投稿などのイベントをトリガーにバックエンドが生成するため、フロントエンドからの実装は不要
- Update（既読管理）/ Delete（通知削除）: 現時点では仕様未確定のため対象外。機能追加時に別途 Issue 化する

---

## User / UserProfile

| CRUD       | Repository                         | Usecase                                | Server Action / API / Server Component 直呼び | UI                             |
| ---------- | ---------------------------------- | -------------------------------------- | ------------------- | ------------------------------ |
| **Create** | ❌                                 | ❌                                     | ❌                  | ❌                             |
| **Read**   | ✅ `getCurrentUser()` `findById()` | ✅ `getCurrentUser()` `findUserById()` | ✅ `/api/viewer`    | ✅ `HomeProfile` `AccountMenu` |
| **Update** | ❌                                 | ❌                                     | ❌                  | ❌                             |
| **Delete** | ❌                                 | ❌                                     | ❌                  | ❌                             |

---

## Subscription

| CRUD       | Repository                  | Usecase                     | Server Action / API / Server Component 直呼び           | UI                    |
| ---------- | --------------------------- | --------------------------- | ----------------------------- | --------------------- |
| **Create** | ✅ `subscribe()` (#217)     | ✅ `subscribeFace()` (#217)   | ✅ `subscribeAction()` (#217)   | ✅ `FaceHeader` `SearchResults` (#217) |
| **Read**   | ✅ `getSubscribedFaceIds()` | ✅ `getSubscribedFaceIds()`   | ✅（Server Component 直呼び）   | ✅ `SubscriptionFeed`                  |
| **Delete** | ✅ `unsubscribe()` (#217)   | ✅ `unsubscribeFace()` (#217) | ✅ `unsubscribeAction()` (#217) | ✅ `FaceHeader` `SearchResults` (#217) |

- ※サブスクリプションはUpdateが存在しないため、CRUDのうちCreate/Read/Deleteのみを表にしています。

---
