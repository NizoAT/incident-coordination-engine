# CD: GitHub Container Registry (M16)

Publication automatique de l'image **production** (`Dockerfile` multi-stage M11) sur **GHCR** après CI verte sur `main`, ou sur push de tag semver.

## Workflow

Fichier : [`.github/workflows/cd.yml`](../.github/workflows/cd.yml)

| Déclencheur | Tags image poussés |
| ----------- | ------------------ |
| CI **réussie** sur `main` | `:main`, `:sha-<court>` |
| Tag Git `v*.*.*` (ex. `v0.2.0`) | `:0.2.0`, `:0.2`, `:0`, `:latest` |
| `workflow_dispatch` | `:sha-<court>` |

Image : `ghcr.io/nizoat/incident-coordination-engine` (minuscules, aligné sur le repo GitHub).

Badge (après premier push CD) :

```markdown
![GHCR](https://ghcr.io/nizoat/incident-coordination-engine:latest)
```

## Prérequis GitHub

1. **Actions** activées sur le repo
2. Workflow **CD** autorisé à écrire dans **Packages** (`permissions.packages: write`: déjà dans le workflow)
3. Visibilité package GHCR :
   - **Public**: `docker pull` sans auth (recommandé portfolio)
   - **Private**: `docker login ghcr.io` avec PAT `read:packages`

Paramètres : *Package settings → Change visibility* ou *Actions → General → Workflow permissions*.

## Pull local

```bash
docker pull ghcr.io/nizoat/incident-coordination-engine:main
docker pull ghcr.io/nizoat/incident-coordination-engine:0.2.0   # après tag v0.2.0
```

Login (package privé) :

```bash
echo "$GITHUB_TOKEN" | docker login ghcr.io -u USERNAME --password-stdin
```

## Deploy staging manuel (Compose)

Fichier : [`compose.staging.yaml`](../compose.staging.yaml): **pas de build**, pull GHCR uniquement.

```bash
cp .env.staging.example .env.staging
# Éditer SESSION_SECRET et GITHUB_WEBHOOK_SECRET

make pull-staging
make up-staging
```

→ http://localhost:8080

Vérification :

```bash
curl -s http://localhost:8080/api/health | jq .
docker compose -f compose.staging.yaml ps
```

### Image / tag custom

```bash
export ICE_IMAGE=ghcr.io/nizoat/incident-coordination-engine:sha-abc1234
docker compose -f compose.staging.yaml pull web
docker compose -f compose.staging.yaml up -d
```

## Release semver

```bash
git tag v0.2.0
git push origin v0.2.0
```

Le workflow CD build + push l'image avec tags semver. Le workflow CI ne se déclenche pas sur les tags seuls: le job CD sur tag exécute son propre build (artefact identique au `Dockerfile` prod).

## CI vs CD

| Workflow | Rôle |
| -------- | ---- |
| **CI** (`ci.yml`) | Qualité : lint, tests, build, E2E, **build** Docker sans push |
| **CD** (`cd.yml`) | **Push GHCR** après CI main, ou sur tag / dispatch |

## Rollback staging

```bash
export ICE_IMAGE=ghcr.io/nizoat/incident-coordination-engine:sha-<ancien>
make pull-staging && make up-staging
```

## Prochaine étape

**M17**: API contract OpenAPI (préparation mobile).
