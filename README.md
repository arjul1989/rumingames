# Gorumin (rumingames)

Monorepo para **gorumin.com** — gift cards de videojuegos con enfoque comunidad (noticias, streamers). Stack: Medusa v2 + Next.js 15.

**Repositorio:** [github.com/arjul1989/rumingames](https://github.com/arjul1989/rumingames)

## Estructura

```
apps/medusa/       # Backend Medusa v2 (commerce + APIs custom)
apps/storefront/   # Next.js storefront (gorumin.com/co)
packages/types/    # Tipos compartidos (@gorumin/types)
scripts/           # Utilidades (ej. seed Jira)
```

## Requisitos locales

- Node.js 20+
- pnpm 10+
- PostgreSQL 15+
- Redis

## Setup

```bash
git clone https://github.com/arjul1989/rumingames.git
cd rumingames
pnpm install

cp .env.example apps/medusa/.env
cp apps/storefront/.env.template apps/storefront/.env.local

createdb gorumin_medusa
cd apps/medusa && pnpm medusa db:migrate
pnpm medusa user -e admin@gorumin.com -p supersecret
```

Arrancar Medusa → `http://localhost:9000/app` · Health → `http://localhost:9000/health`

Crear publishable API key en Medusa Admin → Settings, luego en `apps/storefront/.env.local`:

```
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...
```

```bash
pnpm dev              # backend + storefront
pnpm medusa:dev       # solo Medusa (9000)
pnpm storefront:dev   # solo storefront (8000)
```

Storefront: `http://localhost:8000/co`

## Variables de entorno

Ver `.env.example` en la raíz del proyecto.

## Jira

Épicas e historias en proyecto **RUM**: [tablero](https://rumin.atlassian.net/jira/software/projects/RUM/boards/1)

## Licencia

MIT — basado en [Medusa DTC Starter](https://github.com/medusajs/dtc-starter).
