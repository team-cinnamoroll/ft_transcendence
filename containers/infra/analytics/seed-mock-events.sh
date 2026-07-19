#!/usr/bin/env bash
set -euo pipefail

ES_URL="${ES_URL:-http://localhost:9200}"
KIBANA_URL="${KIBANA_URL:-http://localhost:5601}"
EVENT_COUNT="${EVENT_COUNT:-2500}"
INDEX="events"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KIBANA_OBJECTS="$SCRIPT_DIR/kibana-objects.ndjson"
TMP_NDJSON="$(mktemp)"
trap 'rm -f "$TMP_NDJSON"' EXIT

curl -s -X DELETE "$ES_URL/$INDEX" >/dev/null || true
curl -s -X PUT "$ES_URL/$INDEX" -H 'Content-Type: application/json' -d '{
  "mappings": {
    "properties": {
      "@timestamp": { "type": "date" },
      "type":       { "type": "keyword" },
      "userId":     { "type": "keyword" },
      "faceId":     { "type": "keyword" }
    }
  }
}' >/dev/null

python3 - "$EVENT_COUNT" > "$TMP_NDJSON" <<'PY'
import sys, json, random
from datetime import datetime, timedelta, timezone

random.seed(42)
n = int(sys.argv[1])
now = datetime.now(timezone.utc)
users = [f"user-{i:02d}" for i in range(1, 13)]
faces = [f"face-{i:02d}" for i in range(1, 25)]
hour_weights = [1, 1, 1, 1, 1, 2, 3, 5, 6, 6, 5, 7, 8, 6, 5, 5, 6, 8, 10, 11, 9, 6, 3, 2]
hours = list(range(24))

def rand_ts():
    day_offset = random.randint(0, 13)
    hour = random.choices(hours, weights=hour_weights, k=1)[0]
    d = (now - timedelta(days=day_offset)).replace(
        hour=hour, minute=random.randint(0, 59), second=random.randint(0, 59), microsecond=0
    )
    return d.isoformat()

types = ["activity_created", "login", "logout", "signup"]
type_weights = [55, 25, 18, 2]
for _ in range(n):
    etype = random.choices(types, weights=type_weights, k=1)[0]
    doc = {"@timestamp": rand_ts(), "type": etype, "userId": random.choice(users)}
    if etype == "activity_created":
        doc["faceId"] = random.choice(faces)
    print(json.dumps({"index": {"_index": "events"}}))
    print(json.dumps(doc))
PY

curl -s -H 'Content-Type: application/x-ndjson' -X POST "$ES_URL/_bulk" --data-binary "@$TMP_NDJSON" >/dev/null
curl -s -X POST "$ES_URL/$INDEX/_refresh" >/dev/null
echo "ES count: $(curl -s "$ES_URL/$INDEX/_count" | python3 -c "import sys,json;print(json.load(sys.stdin)['count'])")"

if [ -f "$KIBANA_OBJECTS" ]; then
  curl -s -X POST "$KIBANA_URL/api/saved_objects/_import?overwrite=true" \
    -H 'kbn-xsrf: true' -F "file=@$KIBANA_OBJECTS;type=application/ndjson" >/dev/null || true
  echo "Kibana objects imported."
fi
echo "done. Dashboard: $KIBANA_URL/app/dashboards#/view/events-overview"
