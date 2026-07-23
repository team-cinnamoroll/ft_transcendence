# 可視化基盤 (Elasticsearch + Kibana)
ログ/アクティビティの可視化を、ユーザー向け Next.js とは**分離した独立コンテナ**（Elasticsearch + Kibana）で提供。
Nginx から `/kibana` に直接ルーティングするように設定しました。
本番化時は、投入元を backend の実 API に差し替えて取得元だけ変更する想定です。

## 構成
| コンテナ | 役割 | dev のポート |
| --- | --- | --- |
| `elasticsearch` | データストア | 9200 |
| `kibana` | 可視化 UI（basePath `/kibana`） | 5601 |
`docker-compose.dev.yml` に `profiles: [analytics]` で定義。
**既定の `up` では起動しない**（重いため、可視化を触るときだけ起動する）。

## 起動
ホスト側のターミナルから:
```bash
docker compose -f docker-compose.dev.yml -p ft_transcendence --profile analytics up -d elasticsearch kibana
```

## mock データ + ダッシュボードの投入
ES にサンプルイベント（直近14日・時間帯分布つき 2500件）を投入し、Kibana のデータビュー/可視化/ダッシュボードを import する:
```bash
bash containers/infra/analytics/seed-mock-events.sh
```
環境変数で調整可能: `ES_URL`（既定 `http://localhost:9200`）/ `KIBANA_URL`（既定 `http://localhost:5601/kibana`）/ `EVENT_COUNT`（既定 2500）。

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
| `seed-mock-events.sh` | ES に mock events を投入し、`kibana-objects.ndjson` を Kibana に import する |
| `kibana-objects.ndjson` | データビュー（`events*` / runtime field `hour_of_day`）＋ 可視化3種 ＋ ダッシュボード。再 import で復元可能 |

## 再現性
ES の index も Kibana のオブジェクトも削除した状態から、`seed-mock-events.sh` の一発実行で完全に復元できる（データビュー・可視化・ダッシュボードごと）。

## 本番化（TODO）
- ingestion のデータ取得元を mock から **backend の実 API（API キー等）** に差し替える。
- `docker-compose.local-prod.yml` に ES + Kibana を追加する際は、**コンテナごとの environment を最小限**にし、**security を有効化**、**Kibana は admin 限定アクセス**（Nginx 側で制限）にする。

## 注意
- dev では `xpack.security.enabled=false`（ログイン不要）。
- 本番では有効化する。
