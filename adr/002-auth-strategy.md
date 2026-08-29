# ADR 002: Stratégie d'authentification (M3)

**Date :** 2026-08-29  
**Statut :** Accepté

## Contexte

M3 exige login/logout, sessions, RBAC minimal (responder | lead), et `actorId` sur les événements utilisateur.

## Décision

**Session chiffrée côté serveur via `iron-session` + cookie HTTP-only**, pas de JWT client-side.

| Aspect | Choix |
| ------ | ----- |
| Stockage session | Cookie `ice_session` chiffré (iron-session) |
| Secret | `SESSION_SECRET` (≥ 32 caractères) |
| Mot de passe | `bcryptjs` (12 rounds) |
| Protection routes | `middleware.ts` sur `/incidents/*` → redirect `/login` |
| Server Actions | `getCurrentUser()` + redirect si absent |
| RBAC | Helpers `lib/auth/rbac.ts`, enforced dans le store Prisma |

## Alternatives écartées

| Option | Raison du rejet |
| ------ | ---------------- |
| JWT en localStorage | XSS surface, pas nécessaire pour app SSR monolithique |
| NextAuth / OAuth | Hors scope M3 (pas de SSO) |
| Session DB | Complexité sans gain pour portfolio / démo single-node |

## Conséquences

- **Positif :** KISS, compatible App Router, logout = `session.destroy()`
- **Positif :** Pas de refresh token / rotation JWT à gérer
- **Négatif :** Session non partagée entre instances sans sticky sessions ou store externe (acceptable M3-M5)
- **Négatif :** `SESSION_SECRET` obligatoire au démarrage

## RBAC M3

```text
lead      → voir tous les incidents, assigner (IncidentAssigned)
responder → voir incidents assignés OU créés par soi
```

Todo événement déclenché par un utilisateur authentifié → `actorId` renseigné en base.

## Références

- [`spec/.../M1-M5_SCOPE.md`](../../spec/p1-incident-coordination-engine/M1-M5_SCOPE.md) (M3): repo parcours
