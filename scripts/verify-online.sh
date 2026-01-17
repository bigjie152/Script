#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-${1:-https://script-426.pages.dev}}"
AUTH_USERNAME="${AUTH_USERNAME:-smoke_user}"
AUTH_PASSWORD="${AUTH_PASSWORD:-smoke_pass_123}"
COOKIE_JAR="$(mktemp)"

truncate() {
  local input="$1"
  local limit=800
  if [ "${#input}" -le "$limit" ]; then
    printf "%s" "$input"
  else
    printf "%s" "${input:0:$limit}...(truncated)"
  fi
}

request() {
  local title="$1"
  local method="$2"
  local url="$3"
  local body="${4:-}"
  local expected="$5"

  echo "== $title =="
  echo "URL: $url"
  if [ -n "$body" ]; then
    echo "Body: $body"
    resp=$(printf "%s" "$body" | curl -s -X "$method" -H "Content-Type: application/json" \
      -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
      -w "\nHTTP_STATUS:%{http_code}\nTIME_TOTAL:%{time_total}\n" \
      --data-binary @- "$url")
  else
    resp=$(curl -s -X "$method" \
      -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
      -w "\nHTTP_STATUS:%{http_code}\nTIME_TOTAL:%{time_total}\n" \
      "$url")
  fi

  status=$(echo "$resp" | sed -n 's/^HTTP_STATUS://p')
  time_total=$(echo "$resp" | sed -n 's/^TIME_TOTAL://p')
  body_only=$(echo "$resp" | sed '/^HTTP_STATUS:/d' | sed '/^TIME_TOTAL:/d')

  echo "Status: $status"
  echo "Time: ${time_total}s"
  echo "Response: $(truncate "$body_only")"

  if [ -n "$expected" ]; then
    local ok=1
    for code in $expected; do
      if [ "$status" = "$code" ]; then
        ok=0
      fi
    done
    if [ "$ok" -ne 0 ]; then
      echo "FAIL: expected [$expected], got $status"
      exit 1
    fi
  fi
  echo

  printf "%s" "$body_only"
}

echo "BASE_URL=$BASE_URL"
echo "AUTH_USERNAME=$AUTH_USERNAME"
echo

register_body=$(printf '{"username":"%s","password":"%s"}' "$AUTH_USERNAME" "$AUTH_PASSWORD")
request "auth register" "POST" "$BASE_URL/api/auth/register" "$register_body" "200 201 409" >/dev/null

login_body=$(printf '{"username":"%s","password":"%s"}' "$AUTH_USERNAME" "$AUTH_PASSWORD")
request "auth login" "POST" "$BASE_URL/api/auth/login" "$login_body" "200" >/dev/null

health_resp=$(request "health api" "GET" "$BASE_URL/api/health" "" "200")

create_body='{"name":"Smoke Project","description":"online smoke","content":{"type":"doc","content":[]}}'
create_resp=$(request "create project" "POST" "$BASE_URL/api/projects" "$create_body" "200 201")

project_id=$(echo "$create_resp" | node -e "const fs=require('fs');const data=fs.readFileSync(0,'utf8');try{const j=JSON.parse(data);console.log(j.projectId||j.project?.id||'');}catch{console.log('');}")
if [ -z "$project_id" ]; then
  echo "FAIL: projectId not found in response"
  exit 1
fi
echo "projectId=$project_id"
echo

request "get project" "GET" "$BASE_URL/api/projects/$project_id" "" "200"

truth_body='{"content":{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Truth draft v0.1"}]}]}}'
request "update truth" "PUT" "$BASE_URL/api/projects/$project_id/truth" "$truth_body" "200"

request "list issues" "GET" "$BASE_URL/api/projects/$project_id/issues" "" "200"

echo "== stability: create + read x20 =="
success=0
fail=0
total_time=0
for i in $(seq 1 20); do
  echo "round $i"
  resp=$(printf "%s" "$create_body" | curl -s -X POST -H "Content-Type: application/json" \
    -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
    -w "\nHTTP_STATUS:%{http_code}\nTIME_TOTAL:%{time_total}\n" \
    --data-binary @- "$BASE_URL/api/projects")
  status=$(echo "$resp" | sed -n 's/^HTTP_STATUS://p')
  time_total=$(echo "$resp" | sed -n 's/^TIME_TOTAL://p')
  body_only=$(echo "$resp" | sed '/^HTTP_STATUS:/d' | sed '/^TIME_TOTAL:/d')

  if [ "$status" != "200" ] && [ "$status" != "201" ]; then
    echo "FAIL: create project status $status"
    echo "Response: $(truncate "$body_only")"
    fail=$((fail+1))
    break
  fi

  pid=$(echo "$body_only" | node -e "const fs=require('fs');const data=fs.readFileSync(0,'utf8');try{const j=JSON.parse(data);console.log(j.projectId||j.project?.id||'');}catch{console.log('');}")
  if [ -z "$pid" ]; then
    echo "FAIL: projectId missing in round $i"
    fail=$((fail+1))
    break
  fi

  read_resp=$(curl -s -X GET -b "$COOKIE_JAR" -c "$COOKIE_JAR" -w "\nHTTP_STATUS:%{http_code}\nTIME_TOTAL:%{time_total}\n" \
    "$BASE_URL/api/projects/$pid")
  read_status=$(echo "$read_resp" | sed -n 's/^HTTP_STATUS://p')
  read_time=$(echo "$read_resp" | sed -n 's/^TIME_TOTAL://p')
  if [ "$read_status" != "200" ]; then
    echo "FAIL: read project status $read_status"
    echo "Response: $(truncate "$(echo "$read_resp" | sed '/^HTTP_STATUS:/d' | sed '/^TIME_TOTAL:/d')")"
    fail=$((fail+1))
    break
  fi

  success=$((success+1))
  total_time=$(node -e "const t=parseFloat('$total_time')+parseFloat('$time_total')+parseFloat('$read_time'); console.log(t.toFixed(3));")
done

echo "stability_success=$success"
echo "stability_fail=$fail"
echo "stability_total_time=${total_time}s"

rm -f "$COOKIE_JAR"
