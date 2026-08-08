# 可視化基盤 (Elasticsearch + Logstash + Kibana + Filebeat)

ログ/アクティビティの可視化を、ユーザー向け Next.js とは**分離した独立コンテナ**（ELK スタック）で提供。
イベントは各コンテナの**標準出力（コンテナログ）を Filebeat が収集**する pull 型構成にし、Kibana は Nginx から `/kibana` に直接ルーティングします。
送信側（アプリ）は「決まった形の JSON を1行 stdout に出す」だけでよく、収集側（Filebeat 以降）とは疎結合です。

## パイプライン

```
mock-producer ─stdout─▶ Docker コンテナログ ─▶ Filebeat ─▶ Logstash ─▶ Elasticsearch ─▶ Kibana
（将来: backend）          (ホストの json.log)     (autodiscover)  (整形)        (保存)          (可視化)
```

Filebeat は `analytics_source=true` ラベルの付いたコンテナのログだけを autodiscover で収集する。
将来 backend を可視化に載せる手順は [BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md) を参照。

## 構成

| コンテナ        | 役割                                                           | dev のポート            |
| --------------- | -------------------------------------------------------------- | ----------------------- |
| `mock-producer` | mock イベントを stdout に出す（データ源。将来 backend に置換） | —                       |
| `filebeat`      | 対象コンテナのログを収集し Logstash へ送る                     | —                       |
| `logstash`      | イベントを整形し ES へ投入（index template も管理）            | 5044（beats・内部のみ） |
| `elasticsearch` | データストア                                                   | 9200                    |
| `kibana`        | 可視化 UI（basePath `/kibana`）                                | 5601                    |

`docker-compose.dev.yml` に `profiles: [analytics]` で定義。
**既定の `up` では起動しない**（重いため、可視化を触るときだけ起動する）。

## 起動

ホスト側のターミナルから:

```bash
docker compose -f docker-compose.dev.yml -p ft_transcendence --profile analytics up -d \
  elasticsearch kibana logstash filebeat mock-producer
```

起動すると mock-producer が過去14日分（既定 2500件）を出力し、その後もライブでイベントを出し続ける。
Filebeat がそれを収集して ES に取り込むため、**seed の手動実行は不要**。

## プロビジョニング（index + ダッシュボード）

ES の index template と events index を作成し、Kibana のデータビュー/可視化/ダッシュボードを import する（起動後に一度だけ）:

```bash
bash containers/infra/analytics/provision-kibana.sh
```

events index を正しい mapping（`category`/`action` を keyword）で確定させるため、**backend の実データを流す前に実行する**。既存の events index が dynamic mapping（`category` が text）だった場合は作り直して修復する。
環境変数で調整可能: `ES_URL`（既定 `http://localhost:9200`）/ `KIBANA_URL`（既定 `http://localhost:5601/kibana`）。

## 確認手順

- **Kibana（Nginx 経由）**: http://localhost:8080/kibana
- **Kibana（直接）**: http://localhost:5601/kibana
- ダッシュボード **Events Overview**: http://localhost:8080/kibana/app/dashboards#/view/events-overview
- ES の件数確認（ライブで増え続ける）:

```bash
curl -s http://localhost:9200/events/_count
```

## ファイル

| ファイル                                  | 内容                                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------------------- |
| `mock-producer/produce.py`                | mock イベントを1行 JSON で stdout に出す（`BACKFILL_COUNT` / `LIVE_INTERVAL` で調整） |
| `filebeat/filebeat.yml`                   | `analytics_source=true` のコンテナログを autodiscover し Logstash へ送る              |
| `logstash/pipeline/events.conf`           | beats input → JSON パース → 非分析ログを drop → date filter → メタ除去 → ES output    |
| `logstash/config/logstash.yml`            | Logstash 本体設定（monitoring 無効・pipeline 自動リロード）                           |
| `logstash/templates/events-template.json` | `events*` の index template（`dynamic:false`）。Logstash が ES に登録する             |
| `kibana-objects.ndjson`                   | データビュー（`events*` / runtime field `hour_of_day`）＋ 可視化4種 ＋ ダッシュボード |
| `provision-kibana.sh`                     | index template + events index を作成（dynamic なら修復）し、`kibana-objects.ndjson` を Kibana に import する |
| `BACKEND_INTEGRATION.md`                  | backend の実イベントを可視化に載せる手順（送信側がやること）                          |

## スキーマ

Filebeat が拾うイベントの形（mock も将来の backend もこの形で stdout に出す）:

```json
{
  "@timestamp": "<ISO8601>",
  "category": "auth|face|seed",
  "action": "login|logout|signup|created",
  "userId": "<id>",
  "faceId": "<id>"
}
```

`category` は大分類・`action` は種別。`faceId` は `face`/`seed` の `created` のみ。mapping は `logstash/templates/events-template.json` が単一の所有元で、`dynamic:false` のため定義外フィールドは保存されても index されない。

## 本番 (local-prod)

`docker-compose.local-prod.yml` に ELK を **security + TLS 有効**で追加済み。dev と同じ Logstash pipeline / Filebeat / ダッシュボードを、**入口〜コンテナ間まで全区間 HTTPS**・認証付きで使う。

- **前提(初回)**: hosts に `kibana.tracen.local` を追加、TLS 資材を生成:
  ```txt
  127.0.0.1 tracen.local registry.tracen.local kibana.tracen.local
  ```
  ```bash
  pnpm local-prod:setup-tls   # *.tracen.local のワイルドカード証明書を生成
  pnpm make-env:force         # .env.local-prod を生成(パスワードは本番前に変更)
  ```
- **起動**:
  ```bash
  docker compose -f docker-compose.local-prod.yml --profile analytics up -d \
    elasticsearch es-setup kibana logstash filebeat
  ```
- **全区間 HTTPS**: ES/Kibana/Logstash が `*.tracen.local` 証明書(`/certs` にマウント)で TLS 待ち受け・相互接続する。サービス間はサブドメイン(`elasticsearch.tracen.local` 等、証明書 SAN 一致)で通信。
- **security**: `xpack.security.enabled=true`。**Logstash → `elastic`**、**Kibana → `kibana_system`** で ES に接続(Kibana は elastic superuser を拒否するため、`es-setup` が kibana_system のパスワードを設定)。
- **公開範囲**: ES / Logstash は**外部公開しない**（`local-prod` network 内のみ）。**Kibana のみ Nginx 経由**で公開: `https://kibana.tracen.local`（**ログイン必須** = admin 限定）。
- **収集対象**: backend コンテナ（`analytics_source: 'true'` ラベル済み）の stdout を Filebeat が TLS で Logstash に送る。mock-producer は含めない。
- **provision**: index template は Logstash が自動登録する。ダッシュボード投入は Kibana にアクセスできる環境から `KIBANA_URL=https://kibana.tracen.local provision-kibana.sh` を実行。

## 注意

- dev では `xpack.security.enabled=false`（ログイン不要）。本番では有効化する。
- Filebeat は Docker のコンテナログ（`/var/lib/docker/containers`）と `docker.sock` を読み取り専用でマウントして収集する。
