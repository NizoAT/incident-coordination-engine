#!/bin/sh
# Entrypoint image production: attente Postgres uniquement (migrations hors runtime — ADR 014).
set -e

POSTGRES_HOST="${POSTGRES_HOST:-}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"

if [ -n "$POSTGRES_HOST" ]; then
  echo "→ Attente Postgres (${POSTGRES_HOST}:${POSTGRES_PORT})..."
  until nc -z "$POSTGRES_HOST" "$POSTGRES_PORT"; do
    sleep 1
  done
  echo "✓ Postgres joignable"
fi

exec "$@"
