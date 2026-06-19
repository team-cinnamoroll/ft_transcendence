# データ CRUD 実装状況

凡例: ✅ 実装済み / ⚠️ 部分実装 / ❌ 未実装

---

## Face

| CRUD       | Repository                                   | Usecase                                   | Server Action / API        | UI                                  |
| ---------- | -------------------------------------------- | ----------------------------------------- | -------------------------- | ----------------------------------- |
| **Create** | ✅ `create()`                                | ✅ `createFaceForCurrentUser()`           | ✅ `createFaceAction()`    | ✅ `CreateFaceModal`                |
| **Read**   | ✅ `listByUserId()` `findById()` `listAll()` | ✅ `listFacesByUserId()` `findFaceById()` | ✅ `/api/detail/face/[id]` | ✅ `FacesClient` `FaceDetailClient` |
| **Update** | ❌                                           | ❌                                        | ❌                         | ❌                                  |
| **Delete** | ❌                                           | ❌                                        | ❌                         | ❌                                  |

---

## Seed

| CRUD       | Repository                                      | Usecase                                      | Server Action / API        | UI                                       |
| ---------- | ----------------------------------------------- | -------------------------------------------- | -------------------------- | ---------------------------------------- |
| **Create** | ✅ `create()` (#214)                            | ✅ `createSeedForCurrentUser()` (#214)       | ✅ `createSeedAction()` (#214) | ✅ `PostModal` (#214)               |
| **Read**   | ✅ `findById()` `listAll()` `listByFaceId()` 他 | ✅ `findSeedById()` `listSeedsByFaceId()` 他 | ✅ `/api/detail/seed/[id]` | ✅ `SeedFeed` `SeedDetailPage`           |
| **Update** | ❌                                              | ❌                                           | ❌                         | ❌                                       |
| **Delete** | ❌                                              | ❌                                           | ❌                         | ❌                                       |

---

## Notification

| CRUD       | Repository     | Usecase                  | Server Action / API           | UI                    |
| ---------- | -------------- | ------------------------ | ----------------------------- | --------------------- |
| **Create** | ❌             | ❌                       | ❌                            | ❌                    |
| **Read**   | ✅ `listAll()` | ✅ `listNotifications()` | ❌（Server Component 直呼び） | ✅ `NotificationList` |
| **Update** | ❌             | ❌                       | ❌                            | ❌                    |
| **Delete** | ❌             | ❌                       | ❌                            | ❌                    |

---

## User / UserProfile

| CRUD       | Repository                         | Usecase                                | Server Action / API | UI                             |
| ---------- | ---------------------------------- | -------------------------------------- | ------------------- | ------------------------------ |
| **Create** | ❌                                 | ❌                                     | ❌                  | ❌                             |
| **Read**   | ✅ `getCurrentUser()` `findById()` | ✅ `getCurrentUser()` `findUserById()` | ✅ `/api/viewer`    | ✅ `HomeProfile` `AccountMenu` |
| **Update** | ❌                                 | ❌                                     | ❌                  | ❌                             |
| **Delete** | ❌                                 | ❌                                     | ❌                  | ❌                             |

---

## Subscription

| CRUD       | Repository                  | Usecase                     | Server Action / API           | UI                    |
| ---------- | --------------------------- | --------------------------- | ----------------------------- | --------------------- |
| **Create** | ❌                          | ❌                          | ❌                            | ❌                    |
| **Read**   | ✅ `getSubscribedFaceIds()` | ✅ `getSubscribedFaceIds()` | ❌（Server Component 直呼び） | ✅ `SubscriptionFeed` |
| **Delete** | ❌                          | ❌                          | ❌                            | ❌                    |

- ※サブスクリプションはUpdateが存在しないため、CRUDのうちCreate/Read/Deleteのみを表にしています。

---
