FROM node:24-alpine AS builder
WORKDIR /workspace

# argon2のコンパイルに必要なパッケージを追加
RUN apk add --no-cache python3 make g++

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY containers/apps/contracts/package.json containers/apps/contracts/package.json
COPY containers/apps/backend/package.json containers/apps/backend/package.json
COPY containers/apps/contracts containers/apps/contracts
COPY containers/apps/backend containers/apps/backend

RUN pnpm install
RUN pnpm --filter @tracen/backend build


FROM node:24-alpine
WORKDIR /app

RUN apk add --no-cache python3 make g++

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY containers/apps/contracts/package.json containers/apps/contracts/package.json
COPY containers/apps/backend/package.json containers/apps/backend/package.json
COPY containers/apps/contracts containers/apps/contracts

RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /workspace/containers/apps/backend/dist ./containers/apps/backend/dist
COPY --from=builder /workspace/containers/apps/backend/drizzle ./containers/apps/backend/drizzle
COPY --from=builder /workspace/containers/apps/backend/package.json ./containers/apps/backend/package.json

EXPOSE 8443
CMD ["node", "containers/apps/backend/dist/index.js"]
