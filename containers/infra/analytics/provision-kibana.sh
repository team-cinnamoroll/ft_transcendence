#!/usr/bin/env bash
set -euo pipefail

ES_URL="${ES_URL:-http://localhost:9200}"
KIBANA_URL="${KIBANA_URL:-http://localhost:5601/kibana}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KIBANA_OBJECTS="$SCRIPT_DIR/kibana-objects.ndjson"
EVENTS_TEMPLATE="$SCRIPT_DIR/logstash/templates/events-template.json"

# 既存 events index が dynamic mapping(category が keyword でない)なら作り直す
category_type="$(curl -s "$ES_URL/events/_mapping" 2>/dev/null \
  | python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('events',{}).get('mappings',{}).get('properties',{}).get('category',{}).get('type','none'))" 2>/dev/null || echo none)"
if [ "$category_type" != "keyword" ] && [ "$category_type" != "none" ]; then
  curl -s -o /dev/null -X DELETE "$ES_URL/events"
fi

curl -s -X PUT "$ES_URL/_index_template/events" \
  -H 'Content-Type: application/json' \
  --data-binary "@$EVENTS_TEMPLATE" >/dev/null
curl -s -o /dev/null -X PUT "$ES_URL/events" || true

curl -s -X POST "$KIBANA_URL/api/saved_objects/_import?overwrite=true" \
  -H 'kbn-xsrf: true' -F "file=@$KIBANA_OBJECTS;type=application/ndjson" >/dev/null

echo "Analytics provisioned: index template + events index + Kibana objects."
echo "Dashboard: $KIBANA_URL/app/dashboards#/view/events-overview"
