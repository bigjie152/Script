#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3001/api}"

echo "==> Create project"
project=$(curl -s -X POST "$BASE_URL/projects" \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo Project","description":"V0.1 smoke test"}')
project_id=$(printf "%s" "$project" | python -c "import sys, json; print(json.load(sys.stdin)['projectId'])")

echo "==> Update truth draft"
curl -s -X PUT "$BASE_URL/projects/$project_id/truth" \
  -H "Content-Type: application/json" \
  -d '{"content":{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Truth draft for V0.1."}]}]}}' \
  >/dev/null

echo "==> Lock truth"
lock=$(curl -s -X POST "$BASE_URL/projects/$project_id/truth/lock")
snapshot_id=$(printf "%s" "$lock" | python -c "import sys, json; print(json.load(sys.stdin)['truthSnapshotId'])")

echo "==> Derive roles"
curl -s -X POST "$BASE_URL/projects/$project_id/ai/derive/roles" \
  -H "Content-Type: application/json" \
  -d "{\"truthSnapshotId\":\"$snapshot_id\"}" \
  >/dev/null

echo "==> Consistency check"
curl -s -X POST "$BASE_URL/projects/$project_id/ai/check/consistency" \
  -H "Content-Type: application/json" \
  -d "{\"truthSnapshotId\":\"$snapshot_id\"}" \
  >/dev/null

echo "==> Fetch issues"
curl -s "$BASE_URL/projects/$project_id/issues?truthSnapshotId=$snapshot_id"
echo

echo "==> Optional feedback"
curl -s -X POST "$BASE_URL/projects/$project_id/community/feedback" \
  -H "Content-Type: application/json" \
  -d '{"content":"Looks good for V0.1."}' \
  >/dev/null

curl -s "$BASE_URL/projects/$project_id/community/feedback"
echo
