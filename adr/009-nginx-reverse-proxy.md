# ADR 009 — Nginx reverse proxy dev/prod (M12)

## Statut

Accepté — M12

## Contexte

M10–M11 exposaient Next.js directement sur `:3001`. En prod réelle, l'app est derrière un reverse proxy (compétence deploy/ — preuve portfolio publique).

## Décision

1. Service **`nginx`** (official alpine) dans `compose.yaml` et `compose.prod.yaml`.
2. Template **`deploy/nginx/nginx.conf.example`** + configs actives `conf.d/`.
3. **`web` non publié** sur le host — `expose: 3001` réseau interne uniquement.
4. Entrée publique **`NGINX_PORT` (8080)** — évite conflit avec dev hôte `:3001`.
5. Headers sécurité + upstream keepalive + WebSocket pour `next dev`.
6. Route webhook avec **`proxy_request_buffering off`**.

## Conséquences

- `make dev` hôte reste sur `:3001` (hors Compose).
- `make up` / `make up-prod` → `:8080` via Nginx.
- TLS local hors scope — commenté dans le template.

## Alternatives rejetées

- Caddy/Traefik — Nginx aligné sur expérience prod existante.
- TLS auto M12 — complexité certificats, report M15+.
