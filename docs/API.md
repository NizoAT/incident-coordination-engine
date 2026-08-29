# API v1 (M17)

Contrat OpenAPI : [`openapi.yaml`](../openapi.yaml) à la racine du repo.

## Authentification

```bash
# Obtenir un JWT
curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"lead@demo.local","password":"demo123"}' | jq .

# Appels authentifiés
export TOKEN="<jwt>"
curl -s http://localhost:3001/api/v1/incidents?page=1&pageSize=20 \
  -H "Authorization: Bearer $TOKEN" | jq .
```

## Endpoints

| Méthode | Route | Description |
| ------- | ----- | ----------- |
| POST | `/api/v1/auth/login` | JWT + profil |
| GET | `/api/v1/auth/me` | Profil courant |
| GET | `/api/v1/incidents` | Liste paginée |
| GET | `/api/v1/incidents/{id}` | Détail |
| PATCH | `/api/v1/incidents/{id}` | Mutation (`version` requis) |
| GET | `/api/v1/incidents/{id}/events` | Timeline |

## Variables d'environnement

| Variable | Requis | Description |
| -------- | ------ | ----------- |
| `API_JWT_SECRET` | recommandé | Secret JWT (≥ 32 chars). Fallback `SESSION_SECRET` en dev |
| `API_JWT_TTL_SECONDS` | non | Durée token (défaut 86400) |

## Limitations

- JWT **sans révocation** : valide jusqu'à expiration même après logout web.
- Garantie concurrence optimiste : **web + API** via `patchIncident` (ADR 015).

## Legacy

`PATCH /api/incidents/{id}` (M5) : deprecated, même envelope `{ data | error }`.
