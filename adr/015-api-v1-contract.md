# ADR 015: API contract v1 (M17)

## Statut

Accepté: M17

## Contexte

P2 (`incident-responder`) consommera ICE via HTTP. Jusqu'à M16 : Server Actions (web) + un PATCH legacy sans OpenAPI. ADR 001 (D5) fixe M17 comme moment du contrat formel.

Contraintes review :

- Un seul chemin de mutation incident : `patchIncident` (web + API), lock optimiste partout.
- Pagination list dès v1.
- JWT stateless documenté comme limitation.
- Option 1 : Route Handlers = wrappers fins ; audit S1-S5 après 2-3 endpoints.

## Décision

1. **Prefix** `/api/v1/` pour tous les endpoints mobile.
2. **Auth API** : JWT HS256 (`API_JWT_SECRET`), header `Authorization: Bearer`. Session cookie acceptée en dev (fallback `resolveApiUser`).
3. **Mutations** : `patchIncident` unique (`version` requis) pour status, severity, assigneeId (lead only).
4. **Server Actions web** : appellent `patchIncident` avec champ caché `version` (plus de `store.ts` mutations parallèles).
5. **Envelope JSON** : succès `{ data, meta? }`, erreur `{ error: { code, message, details? }, data? }`.
6. **409** : `VERSION_CONFLICT` + `data.incident` (état courant) pour UX mobile.
7. **Pagination** : `GET /api/v1/incidents?page=&pageSize=` (défaut 20, max 100).
8. **OpenAPI** : `openapi.yaml` + contract tests Vitest.
9. **Legacy** : `PATCH /api/incidents/[id]` conservé temporairement, même envelope, deprecated.

## Limitations assumées (portfolio)

- **JWT sans révocation** : token valide jusqu'à `exp` (`API_JWT_TTL_SECONDS`, défaut 24h), y compris après logout web ou changement de mot de passe.
- **Pas de rate limiting** API en M17.
- **Causality / post-mortem** : hors scope v1 (P2 MVP = liste, détail, ack, assign).

## Bascule Option 2 (application layer)

Audit après endpoints mutables v1 stabilisés. Bascule si ≥ 2 signaux S1-S5 (RBAC dupliqué, transitions dupliquées, schéma Zod dupliqué, mapping erreur copié, double implémentation mutation).

## Conséquences

- Garantie concurrence optimiste **web + API** (scénario RELEASE #3 complet).
- P2 peut contract-test avant code Flutter.
- `store.ts` : lecture + `createIncident` uniquement pour les écritures incident.

## Alternatives rejetées

- Divergence web/API sur le lock : rejetée (perte silencieuse web vs mobile).
- OpenAPI sans unifier web : deux chemins métier divergents.
- Refresh token / revoke list : hors scope M17.
