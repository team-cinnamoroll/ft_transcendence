FROM node:24-alpine AS builder
WORKDIR /workspace

RUN corepack enable

COPY package.json pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend-bff/package.json apps/frontend-bff/package.json
COPY apps/backend apps/backend
COPY apps/frontend-bff apps/frontend-bff

RUN pnpm install
RUN pnpm --filter @tracen/frontend-bff build

FROM node:24-alpine
WORKDIR /app

COPY --from=builder /workspace/apps/frontend-bff/.next/standalone ./
COPY --from=builder /workspace/apps/frontend-bff/.next/static ./.next/static
COPY --from=builder /workspace/apps/frontend-bff/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
