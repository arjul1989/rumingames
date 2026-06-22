# Medusa v2 backend image for Cloud Run.
# Built from the monorepo root context: docker build -f apps/medusa/Dockerfile .
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# --- deps ---
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/medusa/package.json apps/medusa/package.json
COPY packages/types/package.json packages/types/package.json
RUN pnpm install --frozen-lockfile --filter @gorumin/medusa...

# --- build ---
FROM deps AS build
COPY apps/medusa apps/medusa
COPY packages/types packages/types
WORKDIR /app/apps/medusa
RUN pnpm build

# --- runtime ---
FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app/apps/medusa
COPY --from=build /app/apps/medusa/.medusa/server ./
COPY --from=build /app/apps/medusa/package.json ./package.json
RUN pnpm install --prod --frozen-lockfile || pnpm install --prod
# Cloud Run injects PORT; Medusa listens on 9000 by default.
ENV PORT=9000
EXPOSE 9000
CMD ["sh", "-c", "npx medusa db:migrate && npx medusa start"]
