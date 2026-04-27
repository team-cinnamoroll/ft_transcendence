---
applyTo: 'containers/apps/frontend-bff/**'
---

# frontend-bff 専用ルール

この指示は `containers/apps/frontend-bff` 配下の編集にのみ適用する。
全体ルールに加えて、この領域では以下を優先する。

## まず参照するドキュメント

frontend-bff を編集するときは、次のドキュメントを確認し、その方針に沿って判断する。

- `docs/frontend-bff/FRONTEND_ARCHITECTURE.md`
- `docs/frontend-bff/MULTI_FACE.md`
- `docs/frontend-bff/NEW_CONCEPT.md`
- `docs/frontend-bff/TRICLE.md`
- `docs/api/BFF_API_GUIDE.md`

設計判断が迷う場合は、まず `FRONTEND_ARCHITECTURE.md` と `BFF_API_GUIDE.md` を優先し、機能コンセプトは `MULTI_FACE.md` と `NEW_CONCEPT.md` を参照する。

## 制約事項
- containers/apps/frontend-bff、docs/frontend-bff以外のファイルは絶対に編集しない。
- どうしてもcontainers/apps/frontend-bff、docs/frontend-bff以外のファイルを編集する必要がある場合は、必ず確認を取ること。確認なしで編集しないこと。

## 実装方針

- 変更は可能な限り `containers/apps/frontend-bff` 配下に閉じる。
- backend、contracts、infra への変更は、本当に必要な場合に限る。
- 既存の責務分離、命名、ディレクトリ構成、server/client 境界を崩さない。
- UI から「どこからデータを取るか」を意識させない構成を保つ。
- モック実装から backend/API 実装へ差し替えやすい形を維持する。
- 無関係な整形、命名変更、広範囲なリファクタリングは行わない。

## レイヤーと境界のルール

- `src/repositories` と `src/server/usecases` は server-only 境界として扱う。
- Client Component から `src/repositories` や `src/server/usecases` を直接 import しない。
- 読み取りは Server Component または Route Handler、更新は Server Actions を優先する。
- Entry Point は薄く保ち、集約・整形・前提チェックは usecase に寄せる。
- Repository パターンを使う場合は、Spec / Impl / Provider の分離を維持する。
- 契約名は `XxxSpec`、実装名は `xxxImpl`、Provider は `getXxx...()` の命名に揃える。
- モック実装でも contract は `Promise` ベースを維持する。

## BFF / API ルール

- ブラウザが呼ぶ公開 API は BFF の `/api/*` のみを前提にする。
- backend の API をそのまま透過する汎用プロキシは作らない。
- backend 呼び出しが必要な場合でも、BFF 側で画面向けに整形・集約する。
- backend 連携では `@tracen/backend` の `AppType` と Hono RPC を使う既存方針を尊重する。
- 入力検証が必要な場合は `@tracen/contracts` の schema 再利用を優先する。
- `NEXT_PUBLIC_*` には公開してよい値だけを置き、server-only の値を混ぜない。
- env を追加・変更する場合は、関連する Zod 検証や example ファイルとの整合を確認する。

## UI / コンセプト面のルール

- `MultiFace` の表記ルールを守る。
- 「多面性を整理し、自己理解を深めるための短文記録SNS」という方向性を損なわない。
- 他者評価、ランキング、過剰な通知、交流誘導を強める方向の変更は避ける。
- 「気軽に書ける」「見返せる」「自分の思考を整理できる」体験を優先する。
- 仕様判断で迷った場合は、Tricle 由来の「気兼ねなく書き留める」思想と MultiFace の新構想の両方を確認する。

## 変更対象の注意

- 生成物やビルド成果物は編集対象にしない。
- 特に `containers/apps/frontend-bff/.next/**` は編集しない。
- 既存挙動に影響する可能性がある変更では、影響範囲を意識して最小差分にする。
- frontend-bff 外へ影響が及ぶ場合は、その必要性を明確にしてから進める。

## 検証方針

変更後は、変更箇所に近い粒度で確認する。必要に応じて次を優先する。

- `pnpm --filter @tracen/frontend-bff typecheck`
- `pnpm --filter @tracen/frontend-bff lint`

検証していない場合は、その理由を明示する。
