# ADR 004 — Ingestion webhook GitHub idempotente

## Statut

Accepté — M7

## Contexte

Les déploiements peuvent être enregistrés manuellement (M6) ou détectés automatiquement depuis GitHub. GitHub peut **rejouer** le même webhook (`X-GitHub-Delivery` identique) en cas de timeout ou retry.

## Décision

1. **Endpoint public** `POST /api/webhooks/github` — auth par HMAC (`X-Hub-Signature-256`), hors session cookie.
2. **Idempotence** : clé `github:{X-GitHub-Delivery}` stockée dans `Deployment.idempotencyKey` (unique).
3. **États terminaux uniquement** : `success` → `DeploymentStatus.success`, `failure`/`error` → `failed` ; les autres états renvoient `202 ignored`.
4. **Source** : champ `Deployment.source` (`manual` | `github`) pour distinguer l'origine dans l'UI `/changes`.
5. **Lien incident optionnel** : `deployment.payload.incidentId` (client_payload) déclenche `IncidentDeployment` + event `DeploymentDetected`.

## Conséquences

- Un replay GitHub ne crée jamais de doublon — réponse `200 { duplicate: true }`.
- Les déploiements manuels n'ont pas de `idempotencyKey` (nullable).
- Secret partagé `GITHUB_WEBHOOK_SECRET` requis en prod.

## Alternatives rejetées

- Idempotence sur `(githubDeploymentId, state)` — insuffisant si GitHub renvoie plusieurs deliveries pour le même statut.
- Session auth sur webhook — incompatible avec le modèle GitHub.
