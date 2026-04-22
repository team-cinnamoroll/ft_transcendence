FROM mcr.microsoft.com/devcontainers/javascript-node:24-bookworm

RUN apt-get update \
	&& apt-get install -y --no-install-recommends ripgrep openssl mkcert \
	&& rm -rf /var/lib/apt/lists/*

RUN mkcert -install

RUN mkdir -p /workspace/node_modules && chown -R node:node /workspace
