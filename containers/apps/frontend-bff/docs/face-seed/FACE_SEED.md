## 参照

API一覧: @containers/apps/frontend-bff/docs/face-seed/API_LIST.md
バックエンド担当がまとめたAPI仕様書: @docs/api/backend/face-seed.md

## これは何のための実装か

現在モックデータ(`mocks/faces.ts`/`mocks/seeds.ts`)で動いているFace/Seed機能を、既に実装済みのバックエンドAPI(`POST/PUT/DELETE/GET /faces`, `/seeds`)に繋ぎ直す。

## 前提: 開発用シードデータについて

バックエンドには既に `pnpm mock:add-seed`(`containers/apps/backend/test/mocking/seed-mock-data.ts`)というスクリプトが用意されている。`mocks/users.ts`/`faces.ts`/`seeds.ts` を読み込み、サインアップ→Face作成→Seed作成のAPIを順に呼び出してDBに投入してくれる(画像もURLからダウンロードして`file-storage`に自動アップロードしてくれる)。

そのため、「DBにテストデータを入れる仕組みを新規に作る」作業は不要で、以下の**Repository差し替え作業に専念できる**。

## 実装計画

### ステップ1: Face repositoryを本物のAPIに差し替える

**やりたいこと**: `face-repository.ts` にバックエンド版の実装(`createFaceApiRepositoryImpl()`)を追加し、Providerの向き先をモックからAPIへ切り替える。

**どう実現するか**

1. `friendship-repository.ts` と同じパターンで、`createBackendClient(accessToken).api.v1.faces...` をHono RPCで呼ぶ実装を追加する
2. `getFaceRepository` のProviderをAPI実装に向ける
3. Usecase(`server/usecases/faces.ts`)・Action・Componentはすべて `getFaceRepository()` 経由の薄いラッパーになっているため、無改修で動く想定

### ステップ2: Face作成/編集モーダルに画像アップロードUIを追加する

**やりたいこと**: 現状 `name`/`emoji`/`description`/`visibility` しか入力できない `CreateFaceModal.tsx`/`EditFaceModal.tsx` に、画像の選択・アップロード機能を追加する。

**どう実現するか**

1. 既に完成している `file-storage-repository.ts`(`ProfileEditModal.tsx` のアバターアップロードで実績あり)と同じパターンを使う
2. 画像を選択 → Face用のアップロードServer Actionで先にアップロードして `fileId` を取得 → Face作成/更新リクエストの `imageId` にその値を渡す

### ステップ3: Seed repositoryを本物のAPIに差し替える

ステップ1と同様に、`seed-repository.ts` にバックエンド版の実装を追加してProviderを切り替える。

### ステップ4: PostModal(Seed投稿)の画像を実際にアップロードするよう接続する

**やりたいこと**: `PostModal.tsx` は現状、選択した画像をローカルプレビューするだけで実際にはアップロードされておらず、`createSeedAction` にも画像が渡っていない。これを実際にアップロードして送るように直す。

**どう実現するか**

1. 選択した画像ファイルをそれぞれ `file-storage` にアップロードし、`fileId` の配列を得る(Seedは複数枚対応のため、1枚ずつアップロードを繰り返す)
2. 得られた `fileId` の配列を `createSeedAction` の `imageIds` として渡す

**制約事項**

- 1つのSeed投稿につき画像は**最大4枚まで**。フロントエンド側(UIの選択・アップロード処理)で枚数を制御する。`PostModal.tsx` には既に `MAX_IMAGES = 4` という上限定数が存在するため、実装時はそれを維持・再利用する

### ステップ5: 差し替えごとに動作確認する

Face → Seedの順で1つずつ、`pnpm -r typecheck` / `pnpm lint` に加えて、実際に画面を操作して(Face作成・編集・削除・一覧、Seed投稿・編集・削除・一覧)動作確認する。一気に全部差し替えず、Faceが安定してからSeedに進む。

### ステップ6: モック関連ファイルを整理する

全ての差し替えが完了したら、`mocks/faces.ts`/`mocks/seeds.ts` の扱いを検討する。ただし `mock:add-seed` スクリプトが参照データとして使い続けるため、完全に削除はできない点に注意する。

## あえてやらないこと(今回のスコープ外)

- Subscription/Notification/検索機能のバックエンド繋ぎ込み(そもそもバックエンドに未実装のため対象外)
- Face/SeedのユーザーIDが本物のバックエンド発行IDに変わることに伴う、フレンド機能側の `linkableCurrentUser` などの暫定的な区別ロジックの整理・削除(別タスクとして扱う)

## 既知の論点(要確認)

- `mock:add-seed` スクリプトは `mocks/users.ts` のユーザーをサインアップAPI経由で毎回新規作成するため、実行するたびに新しいユーザー・Face・Seedが作られる(重複実行に注意が必要)
- Faceの画像は1枚(`imageId` 単数)、Seedの画像は複数枚(`imageIds` 配列)という非対称性があるが、`file-storage` のアップロードAPI自体は同じものなので、フロント側で複数回呼び出せば対応できる
