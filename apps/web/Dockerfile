# syntax=docker/dockerfile:1.7
# ^^^ DEVE ser literalmente a 1a linha (parser directive BuildKit).

# Aurora Stack landing (stack.aurora-mcp.com + setup.aurora-mcp.com)
# Padrao identico ao BarberAI:
#   - node:20-slim multi-stage
#   - Next.js standalone output
#   - non-root (uid 1001)
#   - cache mount BuildKit no npm install
#
# Build context = raiz do repo aurora-stack (precisa de setup/setup.sh).
# Build no GitHub Actions:
#   docker buildx build -f apps/web/Dockerfile -t ghcr.io/.../aurora-web:latest .

# 1) Dependencias
FROM node:20-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY apps/web/package.json apps/web/package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    npm install --no-audit --no-fund

# 2) Build
FROM node:20-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
# Copia o conteudo do apps/web/
COPY apps/web/ ./
# Copia setup.sh do repo raiz pra public/ (pre-build script tambem
# faz isso, mas no container o cwd seria diferente — entao copiamos
# explicitamente aqui)
COPY setup/setup.sh ./public/setup.sh

RUN npm run build

# 3) Runtime — imagem final enxuta
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=4000
ENV HOSTNAME=0.0.0.0

# Usuario nao-root pra reduzir blast radius. Mesmo padrao do BarberAI.
RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid 1001 nextjs

# Standalone output: como outputFileTracingRoot = apps/web (dir do
# proprio app, nao um monorepo acima), o Next gera layout PLANO:
#   .next/standalone/server.js
#   .next/standalone/node_modules/
# Copiamos preservando esse layout e adicionamos static + public ao lado.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 4000

# Healthcheck-friendly: server.js escuta em $PORT/$HOSTNAME (4000/0.0.0.0).
CMD ["node", "server.js"]
