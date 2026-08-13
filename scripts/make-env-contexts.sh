#!/usr/bin/env bash
set -euo pipefail

mode="${1:-keep}" # keep | force
if [[ "$mode" != "keep" && "$mode" != "force" ]]; then
  echo "Usage: $0 [keep|force]" >&2
  exit 2
fi

# jwt-certs/の作成：Generate RSA key pair for JWT signing and verification.
CERTS_DIR="$(pwd)/jwt-certs"
CURRENT_UID="$(id -u)"
CURRENT_GID="$(id -g)"

mkdir_if_needed() {
	local dir="$1"
	if [ -d "$dir" ]; then
		return 0
	fi

	mkdir -p "$dir" 2>/dev/null || {
		if command -v sudo >/dev/null 2>&1; then
			sudo mkdir -p "$dir"
		else
			echo "ERROR: sudo not found; cannot create $dir" >&2
			exit 1
		fi
	}
}

chown_recursive() {
	local dir="$1"
	if command -v sudo >/dev/null 2>&1; then
		sudo chown -R "${CURRENT_UID}:${CURRENT_GID}" "$dir"
	else
		chown -R "${CURRENT_UID}:${CURRENT_GID}" "$dir"
	fi
}

mkdir_if_needed "$CERTS_DIR"

NEEDS_FIX=0

if [ ! -w "$CERTS_DIR" ]; then
	NEEDS_FIX=1
fi


if [ "$NEEDS_FIX" -eq 1 ]; then
	chown_recursive "$CERTS_DIR"
fi

if [ "$mode" = "force" ]; then
  rm -f "${CERTS_DIR}/private.pem" "${CERTS_DIR}/public.pem"
  echo "Removing existing certs in $CERTS_DIR"
fi

if [ ! -f "${CERTS_DIR}/private.pem" ] || [ ! -f "${CERTS_DIR}/public.pem" ]; then
  openssl genrsa -out "${CERTS_DIR}/private.pem" 2048
  openssl rsa -in "${CERTS_DIR}/private.pem" -pubout -out "${CERTS_DIR}/public.pem"
  echo "Certs generated in $CERTS_DIR"
fi

if [ ! -f .env.dev.example ] || [ ! -f .env.example ]; then
  echo "ERROR: .env example files are missing." >&2
  exit 1
fi

if [ "$mode" = "force" ] && [ -f .env.dev ]; then
  rm -f .env.dev
  echo "Existing .env removed."
fi
if [ ! -f .env.dev ]; then
  cp .env.dev.example .env.dev
  echo ".env file created from example."
fi

if [ "$mode" = "force" ] && [ -f .env ]; then
  rm -f .env
  echo "Existing .env removed."
fi
if [ ! -f .env ]; then
  cp .env.example .env
  echo ".env file created from example."
fi
