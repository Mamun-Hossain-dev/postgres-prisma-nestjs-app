# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

WORKDIR /app

RUN apt-get update \
    && apt-get install --no-install-recommends -y ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable


FROM base AS dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile


FROM dependencies AS migration

COPY prisma ./prisma
COPY prisma.config.ts ./

CMD ["sh", "-c", "for i in 1 2 3 4 5; do pnpm exec prisma migrate deploy && exit 0; echo \"migration attempt $i failed (Neon may be waking up); retrying...\"; sleep 10; done; exit 1"]


FROM dependencies AS build

COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY src ./src

RUN pnpm exec prisma generate && pnpm run build
RUN pnpm prune --prod


FROM node:22-bookworm-slim AS runtime

WORKDIR /app

RUN apt-get update \
    && apt-get install --no-install-recommends -y ca-certificates dumb-init openssl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist

USER node

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "const p=process.env.PORT||8080;fetch('http://127.0.0.1:'+p+'/api/v1/').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/src/main.js"]
