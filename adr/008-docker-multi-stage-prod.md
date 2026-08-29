# ADR 008 — Dockerfile multi-stage production (M11)

## Statut

Accepté — M11

## Contexte

M10 livrait une image **dev** (`Dockerfile.dev`) avec bind-mount et root implicite. Pour portfolio DevOps et déploiement, il faut une image **prod** distincte : plus petite, non-root, scannable.

## Décision

1. **`Dockerfile`** multi-stage : `deps` → `builder` → `runner`.
2. **`output: "standalone"`** dans `next.config.ts` — bundle minimal Next.js.
3. Utilisateur **`nextjs` (uid 1001)** au runtime.
4. **`compose.prod.yaml`** séparé de `compose.yaml` dev.
5. Entrypoint prod : migrate deploy uniquement (pas de seed).
6. **Trivy** via `make docker-scan` — exit code 1 si CRITICAL/HIGH.
7. Cible taille documentée : < 400 MB.

## Conséquences

- Deux chemins Docker explicites (dev M10 / prod M11).
- `Dockerfile.dev` inchangé pour hot reload.
- M12 ajoutera Nginx devant l'image prod.

## Alternatives rejetées

- Une seule image dev/prod — compromet hot reload ou surface prod.
- Distroless Node — complexité Prisma engines sur portfolio M11.
