#!/usr/bin/env bash
set -euo pipefail

KIBANA_URL="${KIBANA_URL:-http://localhost:5601/kibana}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KIBANA_OBJECTS="$SCRIPT_DIR/kibana-objects.ndjson"

curl -s -X POST "$KIBANA_URL/api/saved_objects/_import?overwrite=true" \
  -H 'kbn-xsrf: true' -F "file=@$KIBANA_OBJECTS;type=application/ndjson" >/dev/null
echo "Kibana objects imported."
echo "Dashboard: $KIBANA_URL/app/dashboards#/view/events-overview"
