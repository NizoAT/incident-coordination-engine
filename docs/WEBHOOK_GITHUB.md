# Webhook GitHub — ingestion déploiements (M7)

## Endpoint

```text
POST /api/webhooks/github
```

Headers requis :

| Header | Description |
| ------ | ----------- |
| `X-GitHub-Event` | `deployment_status` |
| `X-GitHub-Delivery` | UUID unique (idempotence) |
| `X-Hub-Signature-256` | HMAC SHA-256 du body |

## Configuration

```env
GITHUB_WEBHOOK_SECRET=your-shared-secret
```

Dans GitHub → Settings → Webhooks → Add webhook :

- **URL** : `https://<host>/api/webhooks/github`
- **Content type** : `application/json`
- **Secret** : même valeur que `GITHUB_WEBHOOK_SECRET`
- **Events** : Deployment status

## Idempotence

```text
idempotencyKey = "github:{X-GitHub-Delivery}"
```

Contrainte unique sur `Deployment.idempotencyKey` — un replay renvoie `200` avec `{ duplicate: true }`.

## États traités

| `deployment_status.state` | Action |
| ------------------------- | ------ |
| `success` | Crée `Deployment` status `success` |
| `failure`, `error` | Crée `Deployment` status `failed` |
| `pending`, `in_progress`, … | `202 ignored` (pas d'enregistrement) |

## Lien incident optionnel

Si `deployment.payload` (client_payload GitHub) contient :

```json
{ "incidentId": "<uuid>" }
```

→ crée aussi `IncidentDeployment` + event `DeploymentDetected`.

## Test local (curl)

```bash
BODY='{"action":"created","deployment":{"id":1,"ref":"v1.0.0","environment":"production","payload":null},"deployment_status":{"id":2,"state":"success","created_at":"2026-01-01T12:00:00Z"}}'
SIG=$(node -e "const {createHmac}=require('node:crypto');const b=process.argv[1],s=process.argv[2];process.stdout.write('sha256='+createHmac('sha256',s).update(b,'utf8').digest('hex'))" "$BODY" "$GITHUB_WEBHOOK_SECRET")

curl -s -X POST http://localhost:3001/api/webhooks/github \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: deployment_status" \
  -H "X-GitHub-Delivery: demo-delivery-001" \
  -H "X-Hub-Signature-256: $SIG" \
  -d "$BODY"
```

Rejouer la même commande → `{ "duplicate": true }`.

## Sécurité

- Pas de session cookie — auth via **signature HMAC** uniquement
- Route hors middleware auth (`/api/*`)
