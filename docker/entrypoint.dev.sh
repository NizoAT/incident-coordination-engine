#!/bin/sh
# Entrypoint conteneur web dev — migrations + seed si DB vide.
set -e

POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"

echo "→ Attente Postgres (${POSTGRES_HOST}:${POSTGRES_PORT})..."
until nc -z "$POSTGRES_HOST" "$POSTGRES_PORT"; do
  sleep 1
done
echo "✓ Postgres joignable"

echo "→ Migrations Prisma..."
npx prisma migrate deploy

echo "→ Seed si base vide..."
npx tsx scripts/seed-if-empty.ts

exec "$@"
