# 可視化基盤 (Elasticsearch + Logstash + Kibana)
ログ/アクティビティの可視化を、ユーザー向け Next.js とは**分離した独立コンテナ**（ELK スタック）で提供。
イベントは **Logstash 経由で取り込む**構成にし、Kibana は Nginx から `/kibana` に直接ルーティングします。
本番化時は、Logstash への送信元を mock から backend の実イベントログに差し替えるだけで、下流（ES/Kibana）は変更不要です。

## パイプライン
```
mock (seed) ──HTTP──▶ Logstash ──▶ Elasticsearch ──▶ Kibana
                         ▲
              将来: backend の実イベントログ
```

## 構成
| コンテナ | 役割 | dev のポート |
| --- | --- | --- |
| `logstash` | イベント取り込み（HTTP input → ES） | 8081（HTTP input） |
| `elasticsearch` | データストア | 9200 |
| `kibana` | 可視化 UI（basePath `/kibana`） | 5601 |

`docker-compose.dev.yml` に `profiles: [analytics]` で定義。
**既定の `up` では起動しない**（重いため、可視化を触るときだけ起動する）。

## 起動
ホスト側のターミナルから:
```bash
docker compose -f docker-compose.dev.yml -p ft_transcendence --profile analytics up -d elasticsearch kibana logstash
```

## mock データ + ダッシュボードの投入
mock イベント（直近14日・時間帯分布つき 2500件）を **Logstash に HTTP 送信**して ES に取り込み、Kibana のデータビュー/可視化/ダッシュボードを import する:
```bash
bash containers/infra/analytics/seed-mock-events.sh
```
スクリプトは events index を作り直し、index template を登録してから mock を Logstash に送り、ES 側の取り込み完了（件数一致）を待ってから終了する。
環境変数で調整可能: `ES_URL`（既定 `http://localhost:9200`）/ `KIBANA_URL`（既定 `http://localhost:5601/kibana`）/ `LOGSTASH_URL`（既定 `http://localhost:8081`）/ `EVENT_COUNT`（既定 2500）。

## 確認手順
- **Kibana（Nginx 経由）**: http://localhost:8080/kibana
- **Kibana（直接）**: http://localhost:5601/kibana
- ダッシュボード **Events Overview**: http://localhost:8080/kibana/app/dashboards#/view/events-overview
  - Events by type（種別内訳）/ Logins over time（日次ログイン）/ Activity by hour of day（投稿の時間帯分布）
- ES の件数確認:

```bash
curl -s http://localhost:9200/events/_count
```

## ファイル

| ファイル | 内容 |
| --- | --- |
| `seed-mock-events.sh` | events index を作り直し、mock events を Logstash に送信し、`kibana-objects.ndjson` を Kibana に import する |
| `kibana-objects.ndjson` | データビュー（`events*` / runtime field `hour_of_day`）＋ 可視化3種 ＋ ダッシュボード。再 import で復元可能 |
| `logstash/pipeline/events.conf` | HTTP input → date filter → Elasticsearch output（index `events`） |
| `logstash/config/logstash.yml` | Logstash 本体設定（monitoring 無効・pipeline 自動リロード） |
| `logstash/templates/events-template.json` | `events*` の index template（mapping の所有元）。seed が ES に登録する |

## スキーマ
Logstash が受け付けるイベントの形（将来 backend もこの形で送る）:
```json
{ "@timestamp": "<ISO8601>", "type": "login|logout|signup|activity_created", "userId": "<id>", "faceId": "<id>" }
```
`faceId` は `activity_created` のみ。mapping は `logstash/templates/events-template.json` が単一の所有元。

## 再現性
ES の index も Kibana のオブジェクトも削除した状態から、`seed-mock-events.sh` の一発実行で完全に復元できる（index template・データ・データビュー・可視化・ダッシュボードごと）。
HTTP input のため取り込みは seed 実行に閉じており、Logstash を再起動しても勝手な再投入は起きない。

## 本番化（TODO）
- Logstash への送信元を mock から **backend の実イベントログ** に差し替える（backend が同じ HTTP input へ送る／取り込み保証が必要なら file・beats input を検討）。
- `docker-compose.local-prod.yml` に ELK を追加する際は、**コンテナごとの environment を最小限**にし、**security を有効化**、**Kibana は admin 限定アクセス**（Nginx 側で制限）にする。

## 注意
- dev では `xpack.security.enabled=false`（ログイン不要）。
- 本番では有効化する。
