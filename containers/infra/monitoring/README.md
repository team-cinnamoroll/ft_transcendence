# モニタリング基盤 (Prometheus + Grafana + Alertmanager)

各サービスのメトリクスを exporter で収集し、Prometheus に蓄積、Grafana で可視化する基盤。

## 構成

```
[各サービス] --(専用exporter)--> /metrics --(scrape)--> [Prometheus] --(query)--> [Grafana]
                                                             │
                                                    (アラート発火)
                                                             ▼
                                                     [Alertmanager] --(通知)--> Discord
```

- **exporter**: 各サービスの状態を Prometheus が読める `/metrics` 形式に変換する。サービス本体は無改修で、隣にコンテナを1つ立てるだけ（nginx のみ後述の `stub_status` 設定が必要）。
- **Prometheus**: exporter を定期 scrape して時系列データとして蓄積・保持する。アラートルールを評価し、発火を Alertmanager へ送る。
- **Grafana**: Prometheus に問い合わせてダッシュボードで可視化する（表示専用。履歴は持たない）。
- **Alertmanager**: Prometheus から受けた発火を集約・整理し、通知先（Discord）へ送る。

## ディレクトリ構成

```
containers/infra/monitoring/
├── README.md
├── prometheus/
│   ├── prometheus.yml                         # scrape 対象・alerting・rule_files の定義
│   └── alert.rules.yml                        # アラートルール本体
├── alertmanager/
│   ├── config.yml                             # 通知のルーティングと receiver(Discord)
│   └── secret/
│       ├── .gitkeep                           # ディレクトリを常に存在させる
│       ├── webhook_url.example                # 記入見本 (追跡)
│       └── webhook_url                        # Discord webhook URL (gitignore・各自作成)
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

監視サービスは dev の通常起動に含まれる（profile 指定は不要。devcontainer 起動時にも自動で立ち上がる）。

```bash
docker compose -f docker-compose.dev.yml up -d
```

| UI           | URL                   | 備考                                                            |
| ------------ | --------------------- | --------------------------------------------------------------- |
| Grafana      | http://localhost:3001 | 初期ログイン admin / admin                                      |
| Prometheus   | http://localhost:9090 | `/targets` で scrape 状態、`/alerts` でアラート状態を確認できる |
| Alertmanager | http://localhost:9093 | 発火中アラートの一覧を確認できる                                |

## コンポーネント

| サービス          | イメージ                                      | 監視対象 / 役割                                                         |
| ----------------- | --------------------------------------------- | ----------------------------------------------------------------------- |
| prometheus        | prom/prometheus                               | メトリクス収集・蓄積・アラート評価                                      |
| grafana           | grafana/grafana                               | 可視化                                                                  |
| alertmanager      | prom/alertmanager                             | アラートの集約・通知 (Discord)                                          |
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

## アラート

Prometheus がルールを評価して発火し、Alertmanager 経由で Discord に通知する。

### 構成要素

- **`prometheus/alert.rules.yml`**: アラートルール本体（採点対象の中心）。現状は以下の3つ。
  - `TargetDown`: 監視対象(exporter含む)が1分以上 scrape 失敗 (`up == 0`)
  - `HostHighMemory`: ホストのメモリ使用率が5分間 85% 超
  - `HostHighCPU`: ホストの CPU 使用率が5分間 85% 超
- **`prometheus/prometheus.yml`**: `alerting:`(宛先 `alertmanager:9093`) と `rule_files:`(上記ファイル) を定義。
- **`alertmanager/config.yml`**: 発火を `alertname` でまとめ、`discord` receiver へ送る。

### 通知先 (Discord webhook) の設定

webhook URL は秘密情報のため git に載せない。`webhook_url_file` 方式で、ファイルから読む。

- **通知を使う人**: 見本をコピーして URL を記入する。
  ```bash
  cp containers/infra/monitoring/alertmanager/secret/webhook_url.example \
     containers/infra/monitoring/alertmanager/secret/webhook_url
  # webhook_url に Discord webhook URL を1行で記入
  ```
- **使わない人**: 何もしなくてよい。`webhook_url` が空でも Alertmanager は正常起動し、
  アラート通知が行われないだけで他は通常どおり動く。
- `secret/webhook_url` は `.gitignore` 済み。`secret/` ディレクトリ自体は `.gitkeep` で常に存在させ、
  ファイルを直接マウントしないことで「ファイル未作成時に Docker がディレクトリを作って壊す」問題を回避している。

### 発火テスト

exporter を1つ止めると `up == 0` になり、1分後に `TargetDown` が発火する。

```bash
docker compose -f docker-compose.dev.yml stop redis-exporter
# http://localhost:9090/alerts で Pending -> Firing を確認
docker compose -f docker-compose.dev.yml start redis-exporter
```

`send_resolved: true` のため、復旧時には解決通知も送られる。

## 設定変更時の反映

- **prometheus.yml / alert.rules.yml を変更したとき**: Prometheus は起動時のみ設定を読むため、再起動が必要。
  ```bash
  docker compose -f docker-compose.dev.yml restart prometheus
  ```
- **alertmanager/config.yml や secret/webhook_url を変更したとき**: Alertmanager を再起動する。
  ```bash
  docker compose -f docker-compose.dev.yml restart alertmanager
  ```
- **datasource/provider/ダッシュボード JSON を変更したとき**: Grafana を再起動する。
  ```bash
  docker compose -f docker-compose.dev.yml up -d grafana
  ```

## 補足・注意点

- **データ永続化**: Prometheus の時系列は `prometheus_data`、Grafana の状態は `grafana_data` ボリュームに保存される。
  Grafana UI で手動作成したダッシュボードはこのボリュームにのみ残り、git には含まれない（他メンバー環境には現れない）。
- **nginx-exporter の前提**: `containers/infra/nginx/nginx.conf` に `stub_status` を返す `location` が必要。
  設定変更後は nginx の再起動も必要。
- **node-exporter の見え方**: Docker Desktop (mac) では監視対象がホスト実機ではなく内部の Linux VM になる。
  本番 Linux 上では実機のリソースを監視する。
