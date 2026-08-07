# 通知機能の廃止 + サブスクリプション機能のフレンドベース置き換え 実装計画

> ゴール: バックエンドAPIが存在せずモックのまま止まっている「通知機能」を完全に廃止する。同じくモックのままの「サブスクリプション機能」も廃止したうえで、URLを `/subscriptions` から `/collection` に変更し、中身をフレンド機能ベースの表示に置き換える。

---

## 1. 背景(なぜ今やるのか)

モック実装の当初、このアプリには「サブスクリプション機能(気になるフェイスをフォローする)」と「通知機能(サブスク中のフェイスの更新を知らせる)」を実装する予定があり、画面の導線だけ先に用意されていた。

しかし開発が進む中で、SNSとしての中心的な機能は「フレンド機能(ユーザー同士の相互関係)」に据えることになった。サブスクリプション機能(フェイス単位の片方向フォロー)は、最終的にフレンド機能に役割を譲ることになったため、もう実装する予定がない。通知機能も同様に、実装の目処が立たないまま今に至っている。

バックエンドAPIも最初から用意されておらず、両機能とも今なおモックデータ(`mocks/subscriptions.ts`、`mocks/notifications.ts`)だけで動いている状態。

## 2. 前提知識(初学者向け)

### 2-1. サブスクリプション・通知・フレンドの違い

|                    | 対象                   | 関係の向き                               | 実装状況                                       |
| ------------------ | ---------------------- | ---------------------------------------- | ---------------------------------------------- |
| サブスクリプション | フェイス(投稿の入れ物) | 片方向(フォローするだけ、相手の承認不要) | モックのみ、バックエンドAPI無し(**今回廃止**） |
| 通知               | -                      | -                                        | モックのみ、バックエンドAPI無し(**今回廃止**） |
| フレンド           | ユーザー               | 双方向(申請→承認が必要)                  | 実装済み、実際のバックエンドAPIに接続済み      |

つまり「フェイスをフォローする」という単位の機能から、「ユーザー同士がフレンドになる」という単位の機能へ、アプリの軸そのものが変わった、ということ。

### 2-2. なぜURLを `/subscriptions` から `/collection` に変更するのか

元々「サブスク中のフェイスを収集する」という意味合いで `/subscriptions` という名前だったが、機能の中身がサブスクリプションではなく「フレンドの投稿フィード」に変わるため、URLもその実態に合わせて `/collection` に変更する。ナビゲーションのラベル自体(「収集」)は、この新しい意味合いとも矛盾しないため変更しない。

通知機能とは異なり、`/collection`(旧 `/subscriptions`)はナビゲーションに残り続けるアクティブなページなので、URLが変わってもユーザーは引き続きナビゲーションのリンクからアクセスできる。

## 3. 現状(すでにあるもの)

### 3-1. 通知機能に関連するファイル

| 種類           | ファイル                                                     |
| -------------- | ------------------------------------------------------------ |
| ページ         | `app/[locale]/(app)/notifications/page.tsx`                  |
| コンポーネント | `components/notifications/NotificationList.tsx`(+ Storybook) |
| Usecase        | `server/usecases/notifications.ts`                           |
| Repository     | `repositories/notification-repository.ts`(モック実装のみ)    |
| モックデータ   | `mocks/notifications.ts`、`mocks/ids.ts` の `NOTIF_IDS`      |
| 型定義         | `types/notification.ts`                                      |
| i18n           | `notifications`、`notificationList` 名前空間(ja/en/fr)       |

**ナビゲーションからのリンクは無い**(SideNav/BottomNav/ContextRailのどこからも `/notifications` へのリンクは存在しない)。

**唯一の注意点**: `server/usecases/data-export.ts`(GDPRエクスポート機能、`/api/export`)が `listNotifications()` を呼び出しており、エクスポートデータに `notifications` フィールドを含めている。ここへの影響は5章で扱う。

### 3-2. サブスクリプション機能に関連するファイル

| 種類           | ファイル                                                                           |
| -------------- | ---------------------------------------------------------------------------------- |
| ページ         | `app/[locale]/(app)/subscriptions/page.tsx`(→ `collection/` にリネーム)            |
| コンポーネント | `components/subscriptions/SubscriptionSeed.tsx`(+ Storybook)                       |
| Usecase        | `server/usecases/subscriptions.ts`                                                 |
| Repository     | `repositories/subscription-repository.ts`(モック実装のみ)                          |
| Server Action  | `server/actions/subscriptions.ts`(`subscribeAction`/`unsubscribeAction`)           |
| モックデータ   | `mocks/subscriptions.ts`                                                           |
| i18n           | `subscriptionSeed`、`subscriptions` 名前空間、`contextRail` 内の一部キー(ja/en/fr) |

**サブスクリプション機能は、`/subscriptions` ページ以外にも複数箇所から参照されている**:

- `SideNav.tsx` / `BottomNav.tsx`: ナビゲーション項目(`nav.subscriptions`、ラベルは「収集」、リンク先を `/collection` に変更)
- `ContextRail.tsx` の `CollectionRail`: `/subscriptions`(→ `/collection`)ページを開いた時にサイドパネルへ表示される「サブスク中のフェイス」「人気のフェイス」(人気のフェイスは元々モック固定値)
- `FaceHeader.tsx`: Face詳細ページ(`/faces/[faceId]`)にある「サブスクする」ボタン(`subscriberCount` はモック固定値の `12`)
- `server/usecases/data-export.ts`: エクスポートデータに `subscribedFaceIds` フィールドを含めている

## 4. 実装する全体の流れ

大きく2つの作業に分かれる。依存関係は無いので、どちらから着手してもよい。

```
A. 通知機能の完全廃止
   ページ・コンポーネント・Usecase・Repository・モック・型・i18n を削除
   → data-export.ts からも notifications フィールドを削除

B. サブスクリプション機能の廃止 + /collection ページへの置き換え
   1. 旧サブスク機能一式(Usecase・Repository・Server Action・モック・i18n)を削除
   2. /subscriptions を /collection にURL変更し、中身を「フレンドの投稿フィード」に差し替え
   3. ContextRail の CollectionRail を「現在フレンドのユーザー一覧 + プロフィールへの導線」に置き換え
   4. FaceHeader の「サブスクする」ボタンを削除する
   5. data-export.ts からも subscribedFaceIds フィールドを削除
```

## 5. 実装ステップ(小さく分割)

### A. 通知機能の完全廃止

1. `app/[locale]/(app)/notifications/page.tsx` を削除する
2. `components/notifications/`(`NotificationList.tsx` + Storybook)を削除する
3. `server/usecases/notifications.ts` を削除する
4. `repositories/notification-repository.ts` を削除する
5. `mocks/notifications.ts` を削除し、`mocks/ids.ts` の `NOTIF_IDS` も削除する
6. `types/notification.ts` を削除する
7. `server/usecases/data-export.ts` から `listNotifications()` の呼び出しと `notifications` フィールドを削除する(`UserDataExport` 型の見直しが必要)
8. i18nメッセージ(ja/en/fr)から `notifications`、`notificationList` 名前空間を削除する

### B. サブスクリプション機能の廃止 + `/collection` への置き換え

1. `app/[locale]/(app)/subscriptions/` ディレクトリを `app/[locale]/(app)/collection/` にリネームする
2. 新しいコンポーネント(例: `components/collection/FriendSeedFeed.tsx`)を作成する
   - フレンド一覧(`getMyFriends()`、実装済みのフレンド機能を利用)を取得する
   - 各フレンドのユーザーIDを使って、投稿(Seed)一覧を取得する(`listSeedsByUserId` など、既存のSeed取得ロジックを利用。**フレンドの投稿だけをまとめて取る専用APIはバックエンドに無いため、フロント側で合成する**)
   - 取得したSeedをタイムライン形式で表示する
3. `app/[locale]/(app)/collection/page.tsx` の中身を、新しいUsecase呼び出し + 新コンポーネントに差し替える
4. 旧 `components/subscriptions/SubscriptionSeed.tsx`(+ Storybook)を削除する
5. `server/usecases/subscriptions.ts`、`repositories/subscription-repository.ts`、`server/actions/subscriptions.ts`、`mocks/subscriptions.ts` を削除する
6. `SideNav.tsx` / `BottomNav.tsx` の `href: '/subscriptions'` を `href: '/collection'` に変更する(ラベル `nav.subscriptions` は変更しない)
7. `ContextRail.tsx` の `CollectionRail` を、フレンド一覧を表示するコンポーネントに置き換える
   - 承認待ち・申請中は含めず、**現在フレンドのユーザーのみ**を表示する(`getMyFriends()` をそのまま使う)
   - 各ユーザーから `/profile/[userId]` へ遷移できるようにする
   - `pathname === '/subscriptions'` の判定を `pathname === '/collection'` に変更する
8. `FaceHeader.tsx` の「サブスクする」ボタン(`subscriberCount` 含む)を削除する
9. `server/usecases/layout.ts` / `(app)/layout.tsx` の `subscribedFaces` / `latestSeedByFaceId` を、ContextRailの新仕様(フレンド一覧)に必要なデータ取得に置き換える、または不要なら削除する
10. `server/usecases/data-export.ts` から `getSubscribedFaceIds()` の呼び出しと `subscribedFaceIds` フィールドを削除する
11. i18nメッセージ(ja/en/fr)から `subscriptionSeed` 名前空間を削除し、`subscriptions` 名前空間・`contextRail` 内のサブスク関連キーを新しい仕様(フレンドの投稿フィード・フレンド一覧)に合わせて書き換える
12. Middleware(`proxy.ts`)のパス判定に `/subscriptions` 固有の記述が無いか確認する(現状ホワイトリスト方式でPUBLIC_PATHS/AUTH_PATHSに個別列挙されていないため変更不要と見込まれるが、実装時に再確認する)

## 6. 確定した仕様

以下は認識合わせが完了した内容。

1. `/collection`(旧 `/subscriptions`)の中身は「フレンドの投稿(シード)フィード」にする
2. `FaceHeader.tsx` の「サブスクする」ボタンは単純に削除する
3. `ContextRail.tsx` の `CollectionRail` は、承認待ち・申請中を含まない「現在フレンドのユーザー一覧」を表示し、各ユーザーのプロフィールへ遷移できるようにする
4. ナビゲーションのラベル「収集」は変更しないが、URLは `/subscriptions` から `/collection` に変更する
5. フレンドの投稿をまとめて取得する専用のバックエンドAPIは存在しないため、フロント側で「フレンド一覧を取る→各フレンドの投稿を取る」という2段階の処理を組む(5章B-2の設計のまま進めてよい。フレンド数が多い場合の呼び出し回数増加は、将来必要になった時点で対応する)
6. `data-export.ts` のエクスポート項目構成は、元々「backend #147(`GET /users/me/export`)と同じ項目構成に揃える」という設計意図があったが、`subscribedFaceIds`/`notifications` は削除してよい(バックエンド側のエクスポートAPIとの項目構成の食い違いは許容する)
