FROM node:24-alpine AS builder
WORKDIR /workspace

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/backend apps/backend

RUN pnpm install
RUN pnpm --filter @tracen/backend build

FROM node:24-alpine
WORKDIR /app

COPY --from=builder /workspace/apps/backend/dist ./dist
COPY --from=builder /workspace/apps/backend/package.json ./package.json

EXPOSE 8443
CMD ["node", "dist/index.js"]
