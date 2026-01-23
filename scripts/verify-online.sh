#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://script-426.pages.dev}"
AUTH_USERNAME="${AUTH_USERNAME:-smoke_user}"
AUTH_PASSWORD="${AUTH_PASSWORD:-smoke_pass_123}"
COOKIE_JAR="$(mktemp)"
COOKIE_JAR_B="$(mktemp)"

truncate_body() {
  local text="$1"
  if [ "${#text}" -le 800 ]; then
    echo "$text"
  else
    echo "${text:0:800}...(truncated)"
  fi
}

invoke_request() {
  local title="$1"
  local method="$2"
  local url="$3"
  local body="${4:-}"
  local expected="${5:-}"
  local jar="${6:-$COOKIE_JAR}"

  echo "== ${title} =="
  echo "URL: ${url}"
  if [ -n "$body" ]; then
    echo "Body: ${body}"
    tmpfile="$(mktemp)"
    printf "%s" "$body" > "$tmpfile"
    resp="$(curl -s -X "$method" -H "Content-Type: application/json" -b "$jar" -c "$jar" \
      -w "\nHTTP_STATUS:%{http_code}\nTIME_TOTAL:%{time_total}\n" --data-binary "@$tmpfile" "$url")"
    rm -f "$tmpfile"
  else
    resp="$(curl -s -X "$method" -b "$jar" -c "$jar" \
      -w "\nHTTP_STATUS:%{http_code}\nTIME_TOTAL:%{time_total}\n" "$url")"
  fi

  status="$(echo "$resp" | grep "^HTTP_STATUS:" | sed 's/HTTP_STATUS://')"
  time_total="$(echo "$resp" | grep "^TIME_TOTAL:" | sed 's/TIME_TOTAL://')"
  body_only="$(echo "$resp" | grep -v "^HTTP_STATUS:" | grep -v "^TIME_TOTAL:")"

  echo "Status: ${status}"
  echo "Time: ${time_total}s"
  echo "Response: $(truncate_body "$body_only")"
  echo ""

  if [ -n "$expected" ] && ! echo "$expected" | grep -q "$status"; then
    echo "FAIL: expected [$expected], got $status"
    exit 1
  fi

  echo "$body_only"
}

echo "BASE_URL=${BASE_URL}"
echo "AUTH_USERNAME=${AUTH_USERNAME}"
echo ""

register_body="{\"username\":\"${AUTH_USERNAME}\",\"password\":\"${AUTH_PASSWORD}\"}"
invoke_request "auth register" "POST" "${BASE_URL}/api/auth/register" "$register_body" "200|201|409" > /dev/null

login_body="{\"username\":\"${AUTH_USERNAME}\",\"password\":\"${AUTH_PASSWORD}\"}"
invoke_request "auth login" "POST" "${BASE_URL}/api/auth/login" "$login_body" "200" > /dev/null

invoke_request "health api" "GET" "${BASE_URL}/api/health" "" "200" > /dev/null

create_body='{"name":"Smoke Project","description":"online smoke","content":{"type":"doc","content":[]}}'
create_resp="$(invoke_request "create project" "POST" "${BASE_URL}/api/projects" "$create_body" "200|201")"
project_id="$(echo "$create_resp" | python - <<'PY'
import json,sys
try:
    data=json.load(sys.stdin)
    print(data.get("projectId") or (data.get("project") or {}).get("id",""))
except Exception:
    print("")
PY
)"

if [ -z "$project_id" ]; then
  echo "FAIL: projectId not found in response"
  exit 1
fi
echo "projectId=${project_id}"
echo ""

invoke_request "get project" "GET" "${BASE_URL}/api/projects/${project_id}" "" "200" > /dev/null

truth_body='{"content":{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Truth draft v0.1"}]}]}}'
invoke_request "update truth" "PUT" "${BASE_URL}/api/projects/${project_id}/truth" "$truth_body" "200" > /dev/null

invoke_request "list issues" "GET" "${BASE_URL}/api/projects/${project_id}/issues" "" "200" > /dev/null

invoke_request "publish project" "POST" "${BASE_URL}/api/projects/${project_id}/publish" "" "200|201" > /dev/null

community_resp="$(invoke_request "community list" "GET" "${BASE_URL}/api/community/projects?sort=latest&q=Smoke" "" "200")"
if ! echo "$community_resp" | grep -q "$project_id"; then
  echo "FAIL: community list does not include project"
  exit 1
fi

auth_user_b="${AUTH_USERNAME}-2"
auth_pass_b="${AUTH_PASSWORD}-2"
register_body_b="{\"username\":\"${auth_user_b}\",\"password\":\"${auth_pass_b}\"}"
invoke_request "auth register (B)" "POST" "${BASE_URL}/api/auth/register" "$register_body_b" "200|201|409" "$COOKIE_JAR_B" > /dev/null
login_body_b="{\"username\":\"${auth_user_b}\",\"password\":\"${auth_pass_b}\"}"
invoke_request "auth login (B)" "POST" "${BASE_URL}/api/auth/login" "$login_body_b" "200" "$COOKIE_JAR_B" > /dev/null

invoke_request "community rating" "PUT" "${BASE_URL}/api/community/projects/${project_id}/rating" '{"score":5}' "200" "$COOKIE_JAR_B" > /dev/null
comment_resp="$(invoke_request "community comment" "POST" "${BASE_URL}/api/community/projects/${project_id}/comments" '{"content":"Suggestion: add character motive","isSuggestion":true}' "201" "$COOKIE_JAR_B")"
comment_id="$(echo "$comment_resp" | python - <<'PY'
import json,sys
try:
    data=json.load(sys.stdin)
    print(((data.get("comment") or {}).get("id")) or "")
except Exception:
    print("")
PY
)"
if [ -z "$comment_id" ]; then
  echo "FAIL: commentId missing"
  exit 1
fi

invoke_request "accept suggestion" "POST" "${BASE_URL}/api/community/comments/${comment_id}/accept" "" "200" > /dev/null
notify_resp="$(invoke_request "notifications (B)" "GET" "${BASE_URL}/api/me/notifications" "" "200" "$COOKIE_JAR_B")"
if ! echo "$notify_resp" | grep -q "suggestion_accepted"; then
  echo "WARN: notification missing suggestion_accepted"
fi

echo "== stability: create + read x20 =="
success=0
fail=0
total_time=0

for i in $(seq 1 20); do
  echo "round ${i}"
  tmpfile="$(mktemp)"
  printf "%s" "$create_body" > "$tmpfile"
  resp="$(curl -s -X POST -H "Content-Type: application/json" -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
    -w "\nHTTP_STATUS:%{http_code}\nTIME_TOTAL:%{time_total}\n" --data-binary "@$tmpfile" "${BASE_URL}/api/projects")"
  rm -f "$tmpfile"
  status="$(echo "$resp" | grep "^HTTP_STATUS:" | sed 's/HTTP_STATUS://')"
  time_total="$(echo "$resp" | grep "^TIME_TOTAL:" | sed 's/TIME_TOTAL://')"
  body_only="$(echo "$resp" | grep -v "^HTTP_STATUS:" | grep -v "^TIME_TOTAL:")"
  if [ "$status" != "200" ] && [ "$status" != "201" ]; then
    echo "FAIL: create project status $status"
    echo "Response: $(truncate_body "$body_only")"
    fail=$((fail+1))
    break
  fi
  round_project_id="$(echo "$body_only" | python - <<'PY'
import json,sys
try:
    data=json.load(sys.stdin)
    print(data.get("projectId") or (data.get("project") or {}).get("id",""))
except Exception:
    print("")
PY
)"
  if [ -z "$round_project_id" ]; then
    echo "FAIL: projectId missing"
    fail=$((fail+1))
    break
  fi
  read_resp="$(curl -s -X GET -b "$COOKIE_JAR" -c "$COOKIE_JAR" -w "\nHTTP_STATUS:%{http_code}\nTIME_TOTAL:%{time_total}\n" "${BASE_URL}/api/projects/${round_project_id}")"
  read_status="$(echo "$read_resp" | grep "^HTTP_STATUS:" | sed 's/HTTP_STATUS://')"
  read_time="$(echo "$read_resp" | grep "^TIME_TOTAL:" | sed 's/TIME_TOTAL://')"
  if [ "$read_status" != "200" ]; then
    echo "FAIL: read project status $read_status"
    fail=$((fail+1))
    break
  fi
  success=$((success+1))
  total_time="$(python - <<PY
print(float("${total_time}") + float("${time_total}") + float("${read_time}"))
PY
)"
done

echo "stability_success=${success}"
echo "stability_fail=${fail}"
echo "stability_total_time=${total_time}s"

rm -f "$COOKIE_JAR" "$COOKIE_JAR_B"
