#!/usr/bin/env bash
# Démo webhook GitHub M7: rejouer la même commande pour voir duplicate: true
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3001}"
DELIVERY_ID="${DELIVERY_ID:-demo-delivery-001}"
SECRET="${GITHUB_WEBHOOK_SECRET:-dev-github-webhook-secret-change-me}"

BODY='{"action":"created","deployment":{"id":42,"ref":"v1.0.0-demo","environment":"production","payload":null},"deployment_status":{"id":99,"state":"success","created_at":"2026-01-01T12:00:00Z"}}'

SIG=$(
  node -e "
    const { createHmac } = require('node:crypto');
    const body = process.argv[1];
    const secret = process.argv[2];
    process.stdout.write('sha256=' + createHmac('sha256', secret).update(body, 'utf8').digest('hex'));
  " "$BODY" "$SECRET"
)

curl -s -w "\nHTTP %{http_code}\n" -X POST "$BASE_URL/api/webhooks/github" \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: deployment_status" \
  -H "X-GitHub-Delivery: $DELIVERY_ID" \
  -H "X-Hub-Signature-256: $SIG" \
  -d "$BODY"
