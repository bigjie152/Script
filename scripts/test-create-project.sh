#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:3001}"

echo "== ok: json body =="
curl -s -i -X POST "$BASE_URL/api/projects" \
  -H "Content-Type: application/json" \
  -d '{"name":"Smoke Project","description":"smoke","content":{"type":"doc","content":[]}}'
echo

echo "== error: missing name =="
curl -s -i -X POST "$BASE_URL/api/projects" \
  -H "Content-Type: application/json" \
  -d '{"description":"missing name"}'
echo

echo "== error: non-json body =="
curl -s -i -X POST "$BASE_URL/api/projects" \
  -H "Content-Type: text/plain" \
  --data "hello"
echo
