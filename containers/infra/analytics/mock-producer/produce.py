import os
import json
import random
import time
from datetime import datetime, timedelta, timezone

random.seed(42)

users = [f"user-{i:02d}" for i in range(1, 13)]
faces = [f"face-{i:02d}" for i in range(1, 25)]
event_kinds = [
    ("auth", "login"),
    ("auth", "logout"),
    ("auth", "signup"),
    ("face", "created"),
]
kind_weights = [25, 18, 2, 55]
hour_weights = [1, 1, 1, 1, 1, 2, 3, 5, 6, 6, 5, 7, 8, 6, 5, 5, 6, 8, 10, 11, 9, 6, 3, 2]
hours = list(range(24))

BACKFILL_COUNT = int(os.environ.get("BACKFILL_COUNT", "2500"))
LIVE_INTERVAL = float(os.environ.get("LIVE_INTERVAL", "5"))


def make_event(ts):
    category, action = random.choices(event_kinds, weights=kind_weights, k=1)[0]
    doc = {"@timestamp": ts, "category": category, "action": action, "userId": random.choice(users)}
    if category == "face":
        doc["faceId"] = random.choice(faces)
    return doc


def emit(doc):
    print(json.dumps(doc), flush=True)


now = datetime.now(timezone.utc)
backfill = []
for _ in range(BACKFILL_COUNT):
    day_offset = random.randint(0, 13)
    hour = random.choices(hours, weights=hour_weights, k=1)[0]
    d = (now - timedelta(days=day_offset)).replace(
        hour=hour, minute=random.randint(0, 59), second=random.randint(0, 59), microsecond=0
    )
    backfill.append(make_event(d.isoformat()))

backfill.sort(key=lambda e: e["@timestamp"])
for e in backfill:
    emit(e)

while True:
    time.sleep(LIVE_INTERVAL)
    emit(make_event(datetime.now(timezone.utc).isoformat()))
