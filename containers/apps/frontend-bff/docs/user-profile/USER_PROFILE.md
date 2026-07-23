## UserProfile導線実装計画

### 使えるAPI

| API                                | 用途                                                                                                                |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `GET /api/v1/users/me`             | ログイン中の自分の情報（`user` と `userProfile`）をまとめて取得。プロフィール未作成でも自動作成される               |
| `PUT /api/v1/user-profile/:userId` | 自分のプロフィール（名前・アイコン・バッジ）を登録／更新                                                            |
| `POST /api/v1/file-storage/upload` | 画像をアップロードし `fileId` を取得する（アバター変更時に使う。JSONではなくヘッダー+バイナリbodyで送る特殊な形式） |

### 今の画面の状態

現在アプリの画面（ホーム、設定、アカウントメニューなど）に表示されている名前・アイコン・投稿数などは**すべてモックデータ**です。一方でログインしているかどうか（`isAuthenticated`）は**すでに本物のログイン状態**を見ています。「ログインは本物、表示中身はまだ作り物」という状態がすでに存在しています。

### 今回やること

プロフィールの「名前・アイコン・バッジ」を本物の backend データに差し替えます。ただし `id` の扱いに注意が必要です。

```
表示用の id（Face/Seedのモック紐付け用）
└─ モックのまま変更しない（本物のIDにするとモックのFace/Seedと紐付かなくなるため）

編集（PUT）に渡す userId
└─ getAuthSession() から取れる本物のユーザーID（JWTのsub）を使う
   ※ backendが「URLのuserId」と「JWTのsub」の一致を検証しているため、モックのIDだと403エラーになる
```

### 使う型

フロントエンドでは `User` 型は使わず `UserProfile` 型だけを使う。`UserProfile` 型は backend の `GET /users/me` が返す `userProfile` の形とすでに一致している。

---

## 実装方針（何をするか）

| #   | やること                                                                                                                             | 使うAPI                     |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------- |
| 1   | `user-profile-repository.ts` を追加し、`getCurrentUser()` でモックの `id` を保ったまま `name`/`avatarUrl`/`badge` を本物に差し替える | `GET /users/me`             |
| 2   | `file-storage-repository.ts` を追加し、画像アップロード用のRepositoryを用意する                                                      | `POST /file-storage/upload` |
| 3   | `user-profile-repository.ts` に保存用メソッドを追加し、Usecase・Server Actionを通す                                                  | `PUT /user-profile/:userId` |
| 4   | `ProfileEditModal` を接続する。画像を選んだら先にアップロードして `fileId` を取得 → 名前・バッジと合わせて保存する                   | 上記2つを組み合わせ         |

補足:

- どの層に何を書くか（Repository/Usecase/Server Actions）は既存の認証実装と同じ形に揃える
- エラー表示（i18n）は認証実装で作った `ApiErrorKind` / `ApiResult<T>`（`src/lib/api-error.ts`）をそのまま再利用する
- `PUT` に渡す `userId` は `currentUser.id`（モック）ではなく `getAuthSession().userId`（本物）を使う

### アバター画像アップロードの方針

- 送るのは `avatarFileId`（アップロードで得たID）、表示に使うのは `avatarUrl`（backendが組み立てて返すURL）。別物なので取り違えない
- `visibility` は `public` にする（他人にも見せるプロフィール画像のため）
- **現在 `ProfileEditModal` のavatar欄は `type="url"` のテキスト入力になっているが、これを `type="file"` のファイル選択に置き換える**（URLを直接入力する方式は廃止する）
- アップロードのタイミング: 画像を**選択した時点で即座にアップロード**する
  - アップロード中はプログレスインジケーターを表示する
  - 保存ボタンはアップロード完了まで無効化する（※画像を触っていない場合は無効化しない）
- 未保存のまま終わったアップロード済みファイルは削除する（`DELETE /file-storage/delete/:fileId`）
  - 対象: モーダルを保存せずに閉じたとき／画像を選び直して前の画像が不要になったとき
- 保存成功時、差し替えられた**古い**アバターファイルの削除はbackend側（`PUT /user-profile/:userId` の中）で対応される前提とする。次回MTGでbackendチームに確認予定だが、フロントエンドはこの前提で実装を進めてよい（フロント側で古いファイルを削除する処理は実装しない）

### 参考にする既存実装

| 参考にしたいポイント                                     | 参考先                                                                                               |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Repository/Usecase/Actionsの層分け・命名規則             | `src/repositories/auth-repository.ts` / `src/server/usecases/auth.ts` / `src/server/actions/auth.ts` |
| `ApiErrorKind` / `ApiResult<T>` の使い方                 | `src/lib/api-error.ts`                                                                               |
| react-hook-form + zodResolver + Server Action の接続方法 | `src/components/auth/SignInForm.tsx`                                                                 |
| ファイル選択UI（プレビュー付き）の既存パターン           | `src/components/ui/PostModal.tsx`（画像添付部分。ただしまだアップロード先はない）                    |
