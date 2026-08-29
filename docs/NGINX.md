# Nginx reverse proxy (M12)

L'application Next.js n'est **plus exposée directement** sur le host en mode Compose: Nginx est le point d'entrée.

## Accès

| Stack | URL |
| ----- | --- |
| Dev Compose | http://localhost:8080 |
| Prod Compose | http://localhost:8080 |
| Health Nginx | http://localhost:8080/nginx-health |
| Health app | http://localhost:8080/api/health |
| Métriques app | http://localhost:8080/api/metrics |

Port custom : `NGINX_PORT=8888 docker compose up`

Le service `web` écoute uniquement sur le réseau Docker (`web:3001`).

## Fichiers

| Fichier | Rôle |
| ------- | ---- |
| `deploy/nginx/nginx.conf.example` | Template documenté (référence + commentaires TLS) |
| `deploy/nginx/conf.d/ice.conf` | Config active montée dans le conteneur |
| `deploy/nginx/conf.d/00-upgrade-map.conf` | Map WebSocket (requis par `http` context) |

## Headers sécurité

- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` restrictive

## Webhook GitHub via proxy

```bash
curl -X POST http://localhost:8080/api/webhooks/github \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: deployment_status" \
  ...
```

`proxy_request_buffering off` sur `/api/webhooks/`: body intact pour HMAC.

## Vérification

```bash
make up
curl -s http://localhost:8080/nginx-health
curl -s http://localhost:8080/api/health | jq .
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/login   # → 200
```

Runbook détaillé : [`docs/ops.md`](ops.md)

## Dépannage

**502 / 504**: attendre le démarrage de `web` (`docker compose logs web`). Ne pas lancer `make dev` hôte en parallèle de Compose dev (bind-mount `/app` → lock Next.js).

## TLS

M12 = HTTP local. Terminaison TLS documentée en commentaire dans `nginx.conf.example` (certificats Let's Encrypt ou reverse proxy amont: M15+ cloud).

## Prochaine étape

**M17**: API contract OpenAPI.
