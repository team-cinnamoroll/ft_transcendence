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
{
  "@timestamp": "<ISO8601>",
  "category": "auth",
  "action": "login",
  "userId": "<id>",
  "faceId": "<id>"
}
```

- `category` は大分類（`auth` | `face` | `seed`）、`action` は種別（`login` | `logout` | `signup` | `created`）
- `faceId` は `face`/`seed` の `created` のときだけ付ける
- この形は ES の mapping と一致済み。**形を変えると載らない**ので厳守

実装イメージ（共通ヘルパー1個 + 各所で呼ぶ）:

```typescript
// analytics.ts
type AnalyticsEvent = {
  category: 'auth' | 'face' | 'seed';
  action: 'login' | 'logout' | 'signup' | 'created';
  userId: string;
  faceId?: string;
};

export function emitAnalyticsEvent(event: AnalyticsEvent): void {
  console.log(JSON.stringify({ '@timestamp': new Date().toISOString(), ...event }));
}
```

呼び出し（例）:

| category | action    | 発生箇所           | 例                                                                                              |
| -------- | --------- | ------------------ | ----------------------------------------------------------------------------------------------- |
| `auth`   | `login`   | サインイン成功     | `emitAnalyticsEvent({ category: "auth", action: "login", userId: user.id })`                    |
| `auth`   | `logout`  | サインアウト       | `emitAnalyticsEvent({ category: "auth", action: "logout", userId: user.id })`                   |
| `auth`   | `signup`  | サインアップ成功   | `emitAnalyticsEvent({ category: "auth", action: "signup", userId: user.id })`                   |
| `face`   | `created` | 投稿(face)作成成功 | `emitAnalyticsEvent({ category: "face", action: "created", userId: user.id, faceId: face.id })` |
| `seed`   | `created` | seed 作成時        | `emitAnalyticsEvent({ category: "seed", action: "created", userId: user.id, faceId: face.id })` |

> HTTP 送信のような失敗ハンドリングは不要。**標準出力に出すだけ**なので、送信失敗もブロッキングも無い（Filebeat 方式の利点）。

### ③ ノイズ選別は対応不要（収集側で実装済み）

backend の stdout には分析イベント以外（アクセスログ、エラー等）も流れますが、**選別は収集側（Logstash）で対応済み**です。backend は上のスキーマで分析イベントを出すことだけ意識すればよく、他のログは自由に出して構いません（マーカー等の追加対応は不要）。

## 収集側（インフラ担当）: 対応済み

分析イベント以外のログを捨てる選別フィルタは `logstash/pipeline/events.conf` に**実装済み**です。
`category` が既知の値でない行（普通のログ文字列＝JSON パース失敗を含む）はすべて drop されます:

```
if [category] not in ["auth", "face", "seed"] {
  drop {}
}
```

node の `console.log` で「分析JSON + 普通のログ（ERROR / nodemon 等）」を混在させて流す実証を行い、
**分析JSON のみが events に入り、普通のログは drop される**ことを確認済みです。

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
- [x] （インフラ）選別フィルタは実装済み（backend 側の追加対応は不要）
- [ ] アプリ操作で ES 件数が増え、中身が実ユーザーIDで、Kibana に反映される

## よくある詰まり

- **ES に入らない**: backend にラベルが付いているか（`docker inspect <backend> | grep analytics_source`）、Filebeat が harvester を起動しているか（`docker logs filebeat | grep -i harvester`）を確認。
- **余計なログまで入る**: Logstash の選別フィルタ（③）が入っているか確認。
- **時刻がずれる**: `@timestamp` を ISO8601（`new Date().toISOString()`）で出しているか確認。
