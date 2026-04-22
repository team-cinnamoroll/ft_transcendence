FROM node:24-alpine AS builder
WORKDIR /workspace

RUN corepack enable

ARG NEXT_PUBLIC_BFF_API_BASE_URL
ENV NEXT_PUBLIC_BFF_API_BASE_URL=$NEXT_PUBLIC_BFF_API_BASE_URL

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY containers/apps/contracts/package.json containers/apps/contracts/package.json
COPY containers/apps/backend/package.json containers/apps/backend/package.json
COPY containers/apps/frontend-bff/package.json containers/apps/frontend-bff/package.json
COPY containers/apps/contracts containers/apps/contracts
COPY containers/apps/backend containers/apps/backend
COPY containers/apps/frontend-bff containers/apps/frontend-bff

RUN pnpm install
RUN pnpm --filter @tracen/frontend-bff build

# Next.js の standalone 出力はファイルトレースにより一部の `next/dist/compiled/*` が
# 省かれることがあり、custom server 起動時に `next/dist/compiled/**` が必要になると
# `MODULE_NOT_FOUND` で起動に失敗することがある。
# builder 側のフルインストールから `dist/compiled` を退避して runtime に持ち込む。
RUN set -eux; \
	next_dir="$(node -p "require('path').dirname(require.resolve('next/package.json', { paths: ['/workspace/containers/apps/frontend-bff'] }))")"; \
	mkdir -p /workspace/.next-runtime-deps; \
	cp -a "$next_dir/dist/compiled" /workspace/.next-runtime-deps/next-dist-compiled

FROM node:24-alpine
WORKDIR /app

COPY --from=builder /workspace/containers/apps/frontend-bff/.next/standalone ./
COPY --from=builder /workspace/containers/apps/frontend-bff/.next/static ./containers/apps/frontend-bff/.next/static
COPY --from=builder /workspace/containers/apps/frontend-bff/public ./containers/apps/frontend-bff/public
COPY --from=builder /workspace/containers/apps/frontend-bff/server-https.cjs ./containers/apps/frontend-bff/server-https.cjs

COPY --from=builder /workspace/.next-runtime-deps/next-dist-compiled /tmp/next-dist-compiled

# Next.js standalone + pnpm の組み合わせだと、standalone 出力に含まれる node_modules が
# `.pnpm/` だけになり、`node_modules/next` のようなトップレベルのリンクが欠けることがある。
# その場合 `require('next')` できず起動に失敗するため、virtual store のリンクを復元する。
RUN set -eux; \
	cd /app/node_modules; \
	if [ ! -d .pnpm/node_modules ]; then \
		echo "Expected /app/node_modules/.pnpm/node_modules to exist" >&2; \
		exit 1; \
	fi; \
	for target in .pnpm/node_modules/*; do \
		name="$(basename "$target")"; \
		[ -e "$name" ] || ln -s "$target" "$name"; \
	done

RUN set -eux; \
	next_dir="$(node -p "require('path').dirname(require.resolve('next/package.json', { paths: ['/app'] }))")"; \
	if [ ! -e "$next_dir/dist/compiled/@babel/runtime/package.json" ] || [ ! -e "$next_dir/dist/compiled/webpack/webpack-lib.js" ]; then \
		rm -rf "$next_dir/dist/compiled"; \
		mkdir -p "$next_dir/dist"; \
		cp -a /tmp/next-dist-compiled "$next_dir/dist/compiled"; \
	fi; \
	rm -rf /tmp/next-dist-compiled

WORKDIR /app/containers/apps/frontend-bff

EXPOSE 3443
CMD ["node", "server-https.cjs"]
