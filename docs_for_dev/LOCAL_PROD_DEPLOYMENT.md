# ローカル本番相当デプロイ（local-prod）

## 想定するデプロイ環境（最初に読む）

この `local-prod` の仕組みは、**「単一ホスト上で Docker Compose を使って、本番に近い実行形態（build 済みイメージ + HTTPS + レジストリ）を再現する」**ためのものです。

想定している環境:

- **単一ホスト**（開発者PC/1台VMなど）で **Docker Engine + Docker Compose v2** が動作している
- デプロイ操作は **そのホスト上で実行**する（SSH で別マシンへ配布する運用は想定しない）
- ホストの `/etc/hosts` を編集できる（`tracen.local` / `registry.tracen.local` を `127.0.0.1` に向ける）
- ホストに **mkcert** を導入でき、ローカルCAを信頼できる（`mkcert -install` を実行できる）
- ホストで少なくとも以下のポートが利用できる
  - **443/tcp**（入口: `https://tracen.local`）
  - **5000/tcp**（ローカルレジストリ: `https://registry.tracen.local:5000`）
- Docker が `registry.tracen.local:5000` の TLS を信頼できるよう、CA を配置できる（例: `/etc/docker/certs.d/...`）

この仕組みが **想定していない** もの:

- インターネット公開の「実運用本番」
- 複数ホスト（クラスタ/Swarm/Kubernetes）
- ゼロダウンタイムや段階的ロールアウト等の高度な運用

目的はあくまで、

- build されたイメージを「レジストリに push → pull」する流れ
- 入口〜コンテナ間まで **全区間 HTTPS**

を、ローカルで手早く検証できるようにすることです。

## できること（概要）

- 入口 `https://tracen.local` を Nginx が TLS 終端
- Nginx → frontend/backend も HTTPS で接続し、**upstream の証明書検証も有効化**
- frontend/backend 自体も TLS で待ち受け（`TLS_CERT_PATH` / `TLS_KEY_PATH`）
- ローカルレジストリ（TLS付き）を立ち上げ、イメージを push してから Compose を起動
- `pnpm local-prod:deploy`（実体は bash スクリプト）で一連の手順を 1 コマンド化

## 使い方（最短）

手順の詳細はリポジトリの README を参照しつつ、流れだけをまとめると以下です。

1) ホストOSで hosts を設定

```txt
127.0.0.1 tracen.local registry.tracen.local
```

2) ホストOSで mkcert の準備（初回のみ）

```bash
mkcert -install
```

3) TLS 資材を生成

```bash
pnpm local-prod:setup-tls
# または
bash scripts/setup-local-prod-tls.sh
```

4) Docker がレジストリの CA を信頼するように設定（初回のみ）

```bash
sudo mkdir -p /etc/docker/certs.d/registry.tracen.local:5000
sudo cp infra/local-prod/certs/ca.crt /etc/docker/certs.d/registry.tracen.local:5000/ca.crt
```

5) デプロイ

```bash
pnpm local-prod:deploy
# または
bash scripts/deploy-local-prod.sh
```

停止:

```bash
pnpm local-prod:down
# または
bash scripts/down-local-prod.sh
```

## 実装した構成（コンポーネント）

- **registry**: `registry:2`（TLSあり）
  - `registry.tracen.local:5000` で待ち受け
  - backend/frontend のイメージを push/pull するために使用
- **nginx**: 入口
  - `https://tracen.local` を受ける
  - `/api/*` → backend、`/*` → frontend
  - upstream への接続も HTTPS + 証明書検証 ON
- **frontend**: Next.js（production build）
  - `.next/standalone` を使い、`server-https.cjs` で HTTPS サーバとして起動
- **backend**: Hono（production build）
  - `TLS_CERT_PATH` / `TLS_KEY_PATH` があれば HTTPS で起動（なければ HTTP）
- **db**: PostgreSQL

## 主要ファイル（実装の置き場所）

- `docker-compose.local-prod.yml`
  - local-prod 全体の Compose 定義（registry/db/backend/frontend/nginx）
  - `TRACEN_IMAGE_TAG` でイメージタグを切り替え
  - backend/frontend/nginx に証明書（`infra/local-prod/certs/*`）をマウント
- `infra/nginx/nginx.https.conf`
  - `tracen.local` の TLS 終端
  - upstream へ HTTPS 接続し、`proxy_ssl_verify on` で検証
- `scripts/setup-local-prod-tls.sh`
  - mkcert で `tracen.local` / `*.tracen.local` の証明書を生成し、CA を `infra/local-prod/certs/ca.crt` にコピー
- `scripts/deploy-local-prod.sh`
  - registry 起動 → backend/frontend build → push → 全サービス起動 → `curl` スモークテスト
- `scripts/down-local-prod.sh`
  - local-prod の Compose を停止
- `apps/backend/src/index.ts`
  - 直実行時に `TLS_CERT_PATH` / `TLS_KEY_PATH` があれば HTTPS で listen
- `apps/frontend-bff/server-https.cjs`
  - Next.js（`output: 'standalone'`）を HTTPS で起動する custom server
- `apps/frontend-bff/Dockerfile`
  - `standalone + pnpm` で起きやすい runtime 依存欠落を回避するための補助（symlink 復元 / `next/dist/compiled` 補完）
- `.gitignore`
  - `infra/local-prod/certs/` をコミット対象外にして鍵素材が混入しないようにする

## デプロイの流れ（scripts/deploy-local-prod.sh）

1. `TRACEN_IMAGE_TAG` を決定（git の短い SHA を基本に、dirty なら `-dirty` を付与）し、`docker compose` の変数として利用
2. local registry を起動（TLS付き）
3. backend/frontend のイメージをビルド
4. 3 で作ったイメージを local registry に push
5. local-prod の Compose 全体を起動（`--remove-orphans`）
6. `curl --cacert infra/local-prod/certs/ca.crt` でスモークテスト
   - `https://tracen.local/api/hello`
   - `https://tracen.local/`

補足:

- スモークテストは最大 30 回リトライします（起動直後の立ち上がり待ちのため）。
- `curl` が無い環境ではスモークテストをスキップします。

## 証明書と信頼関係（なぜ CA が必要か）

- mkcert で作った証明書は「ローカルCAで署名された証明書」なので、以下がその CA を信頼できる必要があります。
  - ブラウザ（ホストOSの信頼ストア）: `https://tracen.local` を警告なしで開くため
  - Docker（レジストリ用）: `docker push/pull` が `registry.tracen.local:5000` を信頼するため
  - Nginx（upstream 検証用）: backend/frontend への `proxy_ssl_verify on` を通すため
  - frontend（Node の outbound HTTPS 用）: SSR/サーバ側から `https://tracen.local/api` へアクセスする場合に備え、`NODE_EXTRA_CA_CERTS` を設定

## トラブルシューティング（よくあるもの）

- `docker push` が TLS エラーになる
  - Docker 側の CA 配置（`/etc/docker/certs.d/registry.tracen.local:5000/ca.crt`）を確認
  - 環境によっては Docker の再起動が必要な場合があります
- `https://tracen.local` が開けない / 証明書警告が出る
  - `mkcert -install` を実行済みか確認
  - `/etc/hosts` の `tracen.local` が正しいか確認
- `443` が使えない（権限/競合）
  - `docker-compose.local-prod.yml` の `nginx` の公開ポートを変更（例: `8443:443`）
- `.local` の名前解決が環境で衝突する
  - `tracen.test` などへ変更し、hosts・証明書SAN・compose の alias を揃えて更新
