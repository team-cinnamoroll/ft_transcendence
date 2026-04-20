FROM node:24-alpine AS builder
WORKDIR /workspace

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY containers/apps/backend/package.json containers/apps/backend/package.json
COPY containers/apps/backend containers/apps/backend

RUN pnpm install
RUN pnpm --filter @tracen/backend build

FROM node:24-alpine
WORKDIR /app

COPY --from=builder /workspace/containers/apps/backend/dist ./dist
COPY --from=builder /workspace/containers/apps/backend/drizzle ./drizzle
COPY --from=builder /workspace/containers/apps/backend/package.json ./package.json

EXPOSE 8443
CMD ["node", "dist/index.js"]
