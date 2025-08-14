#!/usr/bin/env bash
set -euo pipefail

# Minimal POST test for komomood API via Nginx
# Passes if HTTP status is 201 (created) or 409 (conflict on duplicate date)

URL="https://us-south.20011112.xyz/komomood/api/entries"
TODAY_UTC="$(date -u +%Y-%m-%d)"
NOTE_TS="Test via script at $(date -u +%Y-%m-%dT%H:%M:%SZ)"

PAYLOAD=$(jq -n --arg d "$TODAY_UTC" --arg note "$NOTE_TS" '{entry_date: $d, koko_mood: 3, momo_mood: 4, komo_score: 4, note: $note}')

TMP_BODY="$(mktemp)"
HTTP_STATUS=$(curl -sS -o "$TMP_BODY" -w '%{http_code}' \
  -X POST "$URL" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  --data "$PAYLOAD")

echo "== komomood POST test =="
echo "URL      : $URL"
echo "Date     : $TODAY_UTC"
echo "Payload  : $PAYLOAD"
echo "Status   : $HTTP_STATUS"
echo "Response :"
cat "$TMP_BODY" | sed -e 's/.*/  &/' || true
echo

case "$HTTP_STATUS" in
  201)
    echo "PASS: Created new entry."
    ;;
  409)
    echo "PASS: Entry already exists for date (conflict)."
    ;;
  *)
    echo "FAIL: Unexpected HTTP status: $HTTP_STATUS" >&2
    exit 1
    ;;
esac

echo
echo "Verifying fetch:"
curl -sS "$URL" | head -c 500 | sed -e 's/.*/  &/' || true
echo

rm -f "$TMP_BODY" || true


