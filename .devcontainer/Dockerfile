FROM mcr.microsoft.com/devcontainers/javascript-node:24

RUN apt-get update \
	&& apt-get install -y --no-install-recommends ripgrep \
	&& rm -rf /var/lib/apt/lists/*

RUN mkdir -p /workspace/node_modules && chown -R node:node /workspace
