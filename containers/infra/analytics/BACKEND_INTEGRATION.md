# backend 連携ガイド（可視化に実イベントを載せる）

可視化基盤（ELK + Filebeat）は **mock で動作確認済み**です。
mock-producer を backend に置き換えるだけで、実イベントが Kibana に載ります。
このドキュメントは backend 担当が何をすればよいかをまとめたものです。

## 仕組み（先に全体像）
```
backend ─stdout─▶ Docker コンテナログ ─▶ Filebeat ─▶ Logstash ─▶ Elasticsearch ─▶ Kibana
        console.log   (ホストの json.log)   (autodiscover)  (整形)
```
- backend は **決まった形の JSON を1行 stdout に出す**だけ。Filebeat 以降には触れない。
- Filebeat は `analytics_source=true` ラベルの付いたコンテナのログだけを収集する。
- backend への接続やコード注入は一切なし。**stdout に出したものを外から拾うだけ**（読み取り専用）。

## backend 担当がやること（3つ）

### ① コンテナに収集対象ラベルを付ける
`docker-compose.dev.yml` の backend に1行:
```yaml
  backend:
    labels:
      analytics_source: 'true'
```
これが無いと Filebeat は backend のログを拾わない（＝安全側。付けて初めて収集対象になる）。

### ② 分析イベントを1行 JSON で stdout に出す
イベント発生時に、このスキーマの JSON を `console.log` するだけ:
```json
{ "@timestamp": "<ISO8601>", "type": "login|logout|signup|activity_created", "userId": "<id>", "faceId": "<id>" }
```
- `faceId` は `activity_created` のときだけ付ける
- この形は ES の mapping と一致済み。**形を変えると載らない**ので厳守

実装イメージ（共通ヘルパー1個 + 各所で呼ぶ）:
```typescript
// analytics.ts
type AnalyticsEvent = {
  type: "login" | "logout" | "signup" | "activity_created";
  userId: string;
  faceId?: string;
};

export function emitAnalyticsEvent(event: AnalyticsEvent): void {
  console.log(JSON.stringify({ "@timestamp": new Date().toISOString(), ...event }));
}
```
呼び出し（4箇所）:
| type | 発生箇所 | 例 |
| --- | --- | --- |
| `login` | サインイン成功 | `emitAnalyticsEvent({ type: "login", userId: user.id })` |
| `logout` | サインアウト | `emitAnalyticsEvent({ type: "logout", userId: user.id })` |
| `signup` | サインアップ成功 | `emitAnalyticsEvent({ type: "signup", userId: user.id })` |
| `activity_created` | 投稿(face)作成成功 | `emitAnalyticsEvent({ type: "activity_created", userId: user.id, faceId: face.id })` |

> HTTP 送信のような失敗ハンドリングは不要。**標準出力に出すだけ**なので、送信失敗もブロッキングも無い（Filebeat 方式の利点）。

### ③ ノイズと区別できるようにする（重要）
backend の stdout には分析イベント以外（アクセスログ、エラー等）も大量に流れます。
Filebeat はそれも全部拾うため、**分析イベントだけを選別する必要**があります。上のスキーマ（`type` が既知の4種のいずれか）を満たす JSON 行だけを分析イベントとして扱い、それ以外は収集側の Logstash で捨てます（下記）。

## 収集側（インフラ担当）がやること
backend 連携のタイミングで、`logstash/pipeline/events.conf` に**選別フィルタを1つ追加**します。
JSON パースに失敗した行（普通のログ文字列）や、`type` が既知の値でない行を捨てる:
```
filter {
  json { source => "message" }
  if "_jsonparsefailure" in [tags] or [type] not in ["login", "logout", "signup", "activity_created"] {
    drop {}
  }
  date { match => ["@timestamp", "ISO8601"] }
  mutate { remove_field => [...] }
}
```
これで backend の非分析ログは events index に入りません。
（mock 検証時は mock-producer が分析イベントのみを出すため、この選別はまだ入れていません。）

## 動作確認（backend 連携後）
```bash
# analytics 起動（backend も一緒に起動しておく）
docker compose -f docker-compose.dev.yml -p ft_transcendence --profile analytics up -d \
  elasticsearch kibana logstash filebeat backend
bash containers/infra/analytics/provision-kibana.sh   # ダッシュボード投入（初回のみ）

# アプリでログイン等を操作 → 数秒後に件数が増える
curl -s http://localhost:9200/events/_count

# 最新イベントの中身を確認（userId が実ユーザー・余計なフィールドが無い）
curl -s "http://localhost:9200/events/_search?sort=@timestamp:desc&size=3" | python3 -m json.tool

# Kibana を Last 15 min で見て、今の操作が反映されていれば成功
open http://localhost:8080/kibana/app/dashboards#/view/events-overview
```

## チェックリスト
- [ ] backend コンテナに `analytics_source: 'true'` ラベルを付けた
- [ ] 4種のイベント発生箇所で `emitAnalyticsEvent(...)` を呼んだ
- [ ] `docker logs <backend> ` に1行 JSON のイベントが出ている
- [ ] （インフラ）Logstash に選別フィルタを追加した
- [ ] アプリ操作で ES 件数が増え、中身が実ユーザーIDで、Kibana に反映される

## よくある詰まり
- **ES に入らない**: backend にラベルが付いているか（`docker inspect <backend> | grep analytics_source`）、Filebeat が harvester を起動しているか（`docker logs filebeat | grep -i harvester`）を確認。
- **余計なログまで入る**: Logstash の選別フィルタ（③）が入っているか確認。
- **時刻がずれる**: `@timestamp` を ISO8601（`new Date().toISOString()`）で出しているか確認。
