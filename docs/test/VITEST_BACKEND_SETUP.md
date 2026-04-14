# Backend Vitest 設定ガイド

このドキュメントでは、`containers/apps/backend` に導入している Vitest の仕様と使い方を説明します。

## 概要

backend では Hono アプリケーションに対して、Node 環境でのユニットテストを Vitest で実行します。

- テストランナー: `vitest`
- 対象アプリ: `@tracen/backend`
- テスト配置: `containers/apps/backend/test/**/*.test.ts`
- 実装配置: `containers/apps/backend/src/**/*.ts`

## ディレクトリ構成

```text
containers/apps/backend/
  src/
    index.ts
  test/
    index.test.ts
  vitest.config.ts
  tsconfig.json
  package.json
```

## 現在の仕様

### 1. 実行スクリプト

`containers/apps/backend/package.json` の scripts:

- `pnpm -F @tracen/backend test`
  - 単発実行（CI向け）
- `pnpm -F @tracen/backend test:watch`
  - 監視実行（開発向け）

### 2. Vitest 設定

`containers/apps/backend/vitest.config.ts`:

- `environment: 'node'`
  - Node API を前提にテストを実行
- `include: ['test/**/*.test.ts']`
  - `test/` 配下のみをテスト対象にする
- `coverage.reporter: ['text', 'html']`
  - コンソール出力と HTML レポートを生成

### 3. TypeScript 連携

`containers/apps/backend/tsconfig.json`:

- `types` に `vitest/globals` を含める
  - `describe`, `it`, `expect` などの型補完を有効化
- `include` に以下を含める
  - `src/**/*.ts`
  - `test/**/*.ts`
  - `vite.config.ts`
  - `vitest.config.ts`

## Hono 実装でのテスト方針

backend の `src/index.ts` は `app`（Hono インスタンス）を default export しています。
これにより、HTTP サーバーを起動せずに `app.request()` でルートをテストできます。

サンプル（`test/index.test.ts`）:

```ts
import { describe, expect, it } from 'vitest';
import app from '../src/index';

describe('Hono backend', () => {
  it('GET /hello returns expected JSON', async () => {
    const res = await app.request('/hello');

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      message: 'Hello from Hono!',
    });
  });
});
```

ポイント:

- `app.request('/path')` で擬似リクエストが可能
- サーバープロセスを起動しないためテストが高速
- ルート追加時に同パターンでテストを拡張しやすい

## 使用方法

### 基本コマンド

```bash
# backend のテストを1回実行
pnpm -F @tracen/backend test

# backend のテストを監視実行
pnpm -F @tracen/backend test:watch
```

### 推奨の確認フロー

```bash
pnpm -F @tracen/backend lint
pnpm -F @tracen/backend test
pnpm -F @tracen/backend typecheck
```

## 新規テスト追加手順

1. `containers/apps/backend/test/` に `*.test.ts` を作成
2. `../src/...` から対象モジュールを import
3. `describe/it/expect` で仕様を記述
4. `pnpm -F @tracen/backend test` で実行

## よくあるトラブル

### テストが検出されない

原因候補:

- ファイル名が `*.test.ts` になっていない
- 保存先が `test/` 配下ではない

確認:

- `vitest.config.ts` の `include` が `test/**/*.test.ts` になっているか確認

### 型エラー（`describe` などが見つからない）

原因候補:

- `tsconfig.json` の `types` に `vitest/globals` が含まれていない

確認:

- `containers/apps/backend/tsconfig.json` の `compilerOptions.types` を確認

## CI での運用指針

- CI では `test`（単発）を使用する
- `lint` / `test` / `typecheck` を同時に品質ゲート化する
- `test:watch` はローカル開発専用にする

## 関連ファイル

- `containers/apps/backend/package.json`
- `containers/apps/backend/vitest.config.ts`
- `containers/apps/backend/tsconfig.json`
- `containers/apps/backend/src/index.ts`
- `containers/apps/backend/test/index.test.ts`

