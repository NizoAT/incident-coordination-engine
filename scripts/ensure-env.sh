#!/usr/bin/env bash
# Crée .env depuis .env.example si absent ; valide SESSION_SECRET minimal.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env.example ]]; then
  echo "✗ .env.example introuvable"
  exit 1
fi

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "✓ .env créé depuis .env.example"
else
  echo "→ .env existant conservé"
fi

# iron-session exige >= 32 caractères (lib/auth/types.ts)
secret="$(
  grep -E '^SESSION_SECRET=' .env | head -1 | cut -d= -f2- | tr -d "\"'" | tr -d '[:space:]'
)"
if [[ ${#secret} -lt 32 ]]; then
  echo "✗ SESSION_SECRET manquant ou < 32 caractères dans .env"
  exit 1
fi
