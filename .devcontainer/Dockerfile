FROM mcr.microsoft.com/devcontainers/javascript-node:24-bookworm

ENV PATH="/home/node/.local/bin:${PATH}"

RUN apt-get update \
	&& apt-get install -y --no-install-recommends ripgrep openssl mkcert jq which \
	&& rm -rf /var/lib/apt/lists/*


RUN mkdir -p /workspace && chown -R node:node /workspace
