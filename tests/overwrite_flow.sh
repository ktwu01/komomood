#!/usr/bin/env bash
set -euo pipefail

URL="https://us-south.20011112.xyz/komomood/api/entries"
# Use a date that is unlikely to exist yet to make the flow deterministic
DATE="$(date -u -d '+1 day' +%Y-%m-%d)"
NOTE1="Flow test create $(date -u +%H:%M:%S)"
NOTE2="Flow test overwrite $(date -u +%H:%M:%S)"

mk() {
  jq -n --arg d "$DATE" --arg n "$1" '{entry_date:$d,koko_mood:2,momo_mood:3,komo_score:4,note:$n}'
}

do_post() {
  local url="$1"; shift
  local body="$1"; shift
  local tmp_body
  tmp_body="$(mktemp)"
  local status
  status=$(curl -sS -o "$tmp_body" -w '%{http_code}' -X POST "$url" -H 'Content-Type: application/json' -H 'Accept: application/json' --data "$body")
  echo "Status: $status"
  echo "Body  :"; sed -e 's/.*/  &/' "$tmp_body" || true
  echo
  rm -f "$tmp_body" || true
  echo "$status"
}

echo "== Step 1: create =="
s1=$(do_post "$URL" "$(mk "$NOTE1")")
if [ "$s1" != "201" ] && [ "$s1" != "409" ]; then echo "Expected 201 or 409"; exit 1; fi

if [ "$s1" = "201" ]; then
  echo "== Step 2: conflict =="
  s2=$(do_post "$URL" "$(mk "$NOTE1")")
  if [ "$s2" != "409" ]; then echo "Expected 409"; exit 1; fi
fi

echo "== Step 3: overwrite =="
s3=$(do_post "$URL?overwrite=true" "$(mk "$NOTE2")")
if [ "$s3" != "200" ]; then echo "Expected 200"; exit 1; fi

echo "PASS: overwrite flow validated (create-or-conflict → conflict → overwrite=200)"


