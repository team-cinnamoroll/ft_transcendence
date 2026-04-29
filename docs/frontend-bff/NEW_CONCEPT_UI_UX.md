# MultiFace 新構想 UI/UX仕様（共通方針）

## このドキュメントの目的

本ドキュメントは、[docs/frontend-bff/NEW_CONCEPT.md](docs/frontend-bff/NEW_CONCEPT.md) で定義した新構想を、
スマホ比率と PC比率に分けて UI/UX へ落とし込む際の共通方針をまとめる仕様書である。

コンセプトや MVP の成立条件は [docs/frontend-bff/NEW_CONCEPT.md](docs/frontend-bff/NEW_CONCEPT.md) を参照する。
画面幅別の詳細仕様はスマホ比率と PC比率の個別ファイルを参照する。

## 関連ドキュメント

- コンセプトとMVP方針: [docs/frontend-bff/NEW_CONCEPT.md](docs/frontend-bff/NEW_CONCEPT.md)
- UI/UX共通方針: [docs/frontend-bff/NEW_CONCEPT_UI_UX.md](docs/frontend-bff/NEW_CONCEPT_UI_UX.md)
- UI/UX スマホ比率: [docs/frontend-bff/NEW_CONCEPT_UI_UX_MOBILE.md](docs/frontend-bff/NEW_CONCEPT_UI_UX_MOBILE.md)
- UI/UX PC比率: [docs/frontend-bff/NEW_CONCEPT_UI_UX_PC.md](docs/frontend-bff/NEW_CONCEPT_UI_UX_PC.md)

---

## 1. デバイス別ドキュメント構成

- スマホ比率 UI/UX 詳細: [docs/frontend-bff/NEW_CONCEPT_UI_UX_MOBILE.md](docs/frontend-bff/NEW_CONCEPT_UI_UX_MOBILE.md)
- PC比率 UI/UX 詳細: [docs/frontend-bff/NEW_CONCEPT_UI_UX_PC.md](docs/frontend-bff/NEW_CONCEPT_UI_UX_PC.md)

本ファイルは、両者に共通する原則のみを扱う。

---

## 2. 共通ナビゲーション方針

MVP の主要ナビゲーションは、3つのメイン機能と一致する次の 3 タブとする。

| タブ       | 役割                                 |
| ---------- | ------------------------------------ |
| Writing    | すぐ書く（投稿フォームが主役）       |
| Reflection | フェイス一覧と最近の記録を見返す     |
| Collect    | 保存候補の一覧を見て材料を集める     |

### 共通ルール

- `Writing` / `Reflection` / `Collect` は、そのままタブ名称として使用する
- アプリ起動時の初期表示タブは常に `Writing` とする
- 各画面の上部には左側に `Multi Face`、右側にアカウントアイコンを置く
- 各画面の下部には 3 タブのナビゲーションを固定表示する
- アクティブなタブは Indigo 系カラーで強調する
- `Writing` は 3 タブの中で最も「書く」体験を優先し、入力欄を最も大きく目立つ要素として配置する

---

## 3. デバイス別の責務分担

### 3-1. スマホ比率

- 片手操作での入力開始を最優先する
- 1画面1目的を基本とする
- CTA は親指で届く位置に配置する
- 投稿、保存、振り返りはシートや縦積みレイアウトを優先する
- 起動直後は `Writing` タブを開き、まず入力欄が目に入る構成にする

### 3-2. PC比率

- 現在接続中の Figma には PC比率の画面が存在しない
- PC比率の詳細レイアウトは未確定のため、本ドキュメントでは具体仕様を持たない
- PC比率の画面が Figma で確定した時点で、別途このドキュメントへ反映する

---

## 4. Reflection画面仕様

`Reflection` は、フェイス一覧と最近の記録を縦に見返す画面として扱う。

### 4-1. フェイス一覧カード

- 表示内容
  - フェイス画像（テーマに適したアイコンやイメージ画像を大きく目立つように表示）
  - フェイス名
  - そのフェイスに紐づく投稿数・種件数
- UI
  - 縦長の長方形（中に正方形の画像、下部にタイトルと詳細）の2列グリッドカード
- タップ時の挙動
  - 対象テーマの詳細 / 投稿閲覧画面へ遷移

### 4-2. 最近の記録タイムライン

- 表示内容
  - フェイス名
  - 日時
  - 投稿テキスト
  - 画像がある場合は投稿テキストの下に添付画像
- UI
  - 短文ベースの縦積みカードリスト
  - 画像付きの場合は、テキストを主役として上部に配置し、画像は下部に配置する
- タップ時の挙動
  - 投稿の詳細を見るか、内容を編集する

---

## 5. 初回ユーザー向け画面

現在の Figma では、初回ユーザー向けに `Welcome` 画面が定義されている。

- 上部に `Multi Face` とアカウントアイコンを表示する
- 本文では `まずは1つフェイスを作りましょう` を主メッセージとして出す
- 補足文で「用途や自分の一部を切り出すイメージで名前をつける」ことを案内する
- 主 CTA は `＋ フェイスを作成` の 1 ボタンとする

---

## 6. 現時点で未確定の項目

- PC比率の画面構成
- 検索画面の詳細UI
- 再発見カード、フェイス横断ビュー、週次レビューの具体UI

上記は接続中の Figma で画面が確認できないため、本ドキュメントから詳細仕様を削除している。

---

## 7. デザインシステム（Color Scheme & UI Token）

MultiFaceのコンセプトである「自己との対話（Reflection）」「直感的な記録（Writing）」「知の収集（Collect）」を体現するため、ノイズが少なく沈静感のある「スレート（Slate）」ベースの無彩色と、思索を深める「インディゴ（Indigo）」をアクセントとしたカラースキームを定義する。

### 基本カラートークン（Design Tokens）

#### 1. Primary Colors（ブランド・アクション）

- **Primary (`#4F46E5` / Indigo-600)**: アプリへの注目と冷静な思考を促す青紫。CTAボタン（「保存する」など）、アクティブなタブ、選択中のフェイスチップなど、主要アクションや導線を示すセマンティックカラーとして使用する。
- **Primary-Light (`#EEF2FF` / Indigo-50)**: インディゴの要素と組み合わせる淡い背景色として利用。

#### 2. Background & Surface Colors（背景・階層）

- **Background (`#F8FAFC` / Slate-50)**: アプリ全体のベース背景色。完全な白ではなく、わずかに青みを持ったスレートグレイを敷くことで、長時間のタイピングや画面の睨み合いにおける眼精疲労（Eye Strain）を軽減する。
- **Surface (`#FFFFFF` / White)**: カード UI、ダイアログ、ボトムシートなど「浮き上がる」要素の背景。Backgroundの色とのコントラスト差によって、視覚的に要素のかたまり（Elevation）を分割する。
- **Border (`#E2E8F0` / Slate-200)**: 基本的な枠線だが、本UIでは境界線の多用を避け、余白によるスペーシングと背景色の差異で情報設計（Information Architecture）を行うことを推奨する。

#### 3. Typography Colors（テキスト・可読性）

- **Text-Primary (`#0F172A` / Slate-900)**: 見出し、ユーザーが入力する主要なテキスト。画面上の最も強い情報を持たせる。
- **Text-Secondary (`#64748B` / Slate-500)**: タイムスタンプや補助的な説明、プレースホルダー。あえて視覚的階層（Visual Hierarchy）を落とし、Primary Textの邪魔にならないようにする。
- **Text-Inverse (`#FFFFFF` / White)**: Primary要素など、濃い背景の上に乗せる文字。十分なコントラスト比（WCAG AA以上）を担保して可読性を保つ。

これらの色は、アプリ全体の雰囲気を「質素」から「静かで思索的（モダン）」なテイストへ引き上げると同時に、ユーザーの集中力を阻害しない認知負荷設計に適している。
