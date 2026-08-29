#!/usr/bin/env bash
# Attend que Postgres (service compose) accepte les connexions.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

MAX_ATTEMPTS="${WAIT_FOR_POSTGRES_ATTEMPTS:-60}"
SLEEP_SECONDS="${WAIT_FOR_POSTGRES_SLEEP:-1}"

echo "→ Attente Postgres (max ${MAX_ATTEMPTS}s)..."

for ((i = 1; i <= MAX_ATTEMPTS; i++)); do
  if docker compose exec -T postgres pg_isready -U ice -d incident_coordination_engine >/dev/null 2>&1; then
    echo "✓ Postgres prêt"
    exit 0
  fi
  sleep "$SLEEP_SECONDS"
done

echo "✗ Postgres indisponible après ${MAX_ATTEMPTS} tentatives"
echo "  Vérifiez : docker compose ps && docker compose logs postgres"
exit 1
