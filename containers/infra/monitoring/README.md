# モニタリング基盤 (Prometheus + Grafana)

各サービスのメトリクスを exporter で収集し、Prometheus に蓄積、Grafana で可視化する基盤。

## 構成

```
[各サービス] --(専用exporter)--> /metrics --(scrape)--> [Prometheus] --(query)--> [Grafana]
```

- **exporter**: 各サービスの状態を Prometheus が読める `/metrics` 形式に変換する。サービス本体は無改修で、隣にコンテナを1つ立てるだけ（nginx のみ後述の `stub_status` 設定が必要）。
- **Prometheus**: exporter を定期 scrape して時系列データとして蓄積・保持する。
- **Grafana**: Prometheus に問い合わせてダッシュボードで可視化する（表示専用。履歴は持たない）。

## ディレクトリ構成

```
containers/infra/monitoring/
├── README.md
├── prometheus/
│   └── prometheus.yml                         # scrape 対象の定義
└── grafana/
    ├── provisioning/
    │   ├── datasources/datasource.yml         # Prometheus を datasource として自動登録
    │   └── dashboards/provider.yml            # dashboards/ を自動読み込みする設定
    └── dashboards/                            # ダッシュボード本体 (JSON)。git 管理
        ├── node.json
        ├── cadvisor.json
        ├── postgres.json
        ├── redis.json
        └── nginx.json
```

Grafana は起動時に `provisioning/` を読み、datasource とダッシュボードを自動投入する（UI での手作業は不要）。

## 起動方法

```bash
docker compose -f docker-compose.dev.yml --profile monitoring up -d
```

| UI         | URL                   | 備考                                  |
| ---------- | --------------------- | ------------------------------------- |
| Grafana    | http://localhost:3001 | 初期ログイン admin / admin            |
| Prometheus | http://localhost:9090 | `/targets` で scrape 状態を確認できる |

## コンポーネント

| サービス          | イメージ                                      | 監視対象 / 役割                                                         |
| ----------------- | --------------------------------------------- | ----------------------------------------------------------------------- |
| prometheus        | prom/prometheus                               | メトリクス収集・蓄積                                                    |
| grafana           | grafana/grafana                               | 可視化                                                                  |
| node-exporter     | prom/node-exporter                            | ホスト(Docker Desktop では Linux VM)の CPU/メモリ/ディスク/ネットワーク |
| cadvisor          | gcr.io/cadvisor/cadvisor                      | コンテナ単位のリソース使用量                                            |
| postgres-exporter | quay.io/prometheuscommunity/postgres-exporter | PostgreSQL の接続数/クエリ/DB サイズ等                                  |
| redis-exporter    | oliver006/redis_exporter                      | Redis のメモリ/接続数/ヒット率等                                        |
| nginx-exporter    | nginx/nginx-prometheus-exporter               | Nginx の接続数/リクエスト数 (`stub_status` を読む)                      |

exporter はホストにポート公開していない。Prometheus が内部ネットワーク経由で `サービス名:ポート` を scrape する（設定は `prometheus.yml`）。

## ダッシュボード

各 exporter の定番ダッシュボードを採用している。出典と選定根拠は以下。

| ファイル      | 出典                                                                                                                   | 選定根拠                                                |
| ------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| node.json     | [grafana.com 1860](https://grafana.com/grafana/dashboards/1860)                                                        | Node Exporter Full。約1.4億DL・現行メンテの事実上の標準 |
| cadvisor.json | [grafana.com 15798](https://grafana.com/grafana/dashboards/15798)                                                      | Docker monitoring。約139万DL・継続更新                  |
| postgres.json | [grafana.com 9628](https://grafana.com/grafana/dashboards/9628)                                                        | PostgreSQL Database。約1,231万DL                        |
| redis.json    | [grafana.com 763](https://grafana.com/grafana/dashboards/763)                                                          | redis_exporter 作者本人が公開する純正ダッシュボード     |
| nginx.json    | [nginx/nginx-prometheus-exporter](https://github.com/nginx/nginx-prometheus-exporter/blob/main/grafana/dashboard.json) | exporter 開発元 nginx がリポジトリに同梱する公式        |

### ダッシュボードの再取得・追加

ダウンロードした JSON は datasource を各自の変数名(`${DS_PROMETHEUS}` 等)で参照しているため、
`datasource.yml` の `uid: prometheus` に置換する必要がある。以下は取得と置換をまとめて行う手順。

```bash
cd containers/infra/monitoring/grafana/dashboards

# 取得 (nginx のみ開発元公式 repo から)
curl -sL "https://grafana.com/api/dashboards/1860/revisions/latest/download" -o node.json
curl -sL "https://grafana.com/api/dashboards/15798/revisions/latest/download" -o cadvisor.json
curl -sL "https://grafana.com/api/dashboards/9628/revisions/latest/download" -o postgres.json
curl -sL "https://grafana.com/api/dashboards/763/revisions/latest/download" -o redis.json
curl -sL "https://raw.githubusercontent.com/nginx/nginx-prometheus-exporter/main/grafana/dashboard.json" -o nginx.json

# datasource 変数を JSON から読み取り、uid(prometheus) に置換
python3 - <<'PY'
import json, glob
for f in sorted(glob.glob('*.json')):
    d = json.load(open(f))
    names = set()
    for inp in d.get('__inputs', []):
        if inp.get('type') == 'datasource':
            names.add(inp['name'])
    for v in d.get('templating', {}).get('list', []):
        if v.get('type') == 'datasource':
            names.add(v['name'])
    txt = open(f).read()
    for n in names:
        txt = txt.replace('${%s}' % n, 'prometheus')
    open(f, 'w').write(txt)
    print(f'{f}: {sorted(names)} -> prometheus')
PY
```

生成した JSON は git 管理するため、他メンバーはこのコマンドを実行する必要はない（`git pull` + 起動のみ）。

## 設定変更時の反映

- **prometheus.yml を変更したとき**: Prometheus は起動時のみ設定を読むため、再起動が必要。
  ```bash
  docker compose -f docker-compose.dev.yml --profile monitoring restart prometheus
  ```
- **datasource/provider/ダッシュボード JSON を変更したとき**: Grafana を再起動する。
  ```bash
  docker compose -f docker-compose.dev.yml --profile monitoring up -d grafana
  ```

## 補足・注意点

- **データ永続化**: Prometheus の時系列は `prometheus_data`、Grafana の状態は `grafana_data` ボリュームに保存される。
  Grafana UI で手動作成したダッシュボードはこのボリュームにのみ残り、git には含まれない（他メンバー環境には現れない）。
- **nginx-exporter の前提**: `containers/infra/nginx/nginx.conf` に `stub_status` を返す `location` が必要。
  設定変更後は nginx の再起動も必要。
- **node-exporter の見え方**: Docker Desktop (mac) では監視対象がホスト実機ではなく内部の Linux VM になる。
  本番 Linux 上では実機のリソースを監視する。
