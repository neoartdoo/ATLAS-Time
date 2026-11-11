#!/usr/bin/env bash
# Build and start ATLAS Personal Time with Docker Compose (needs Docker Engine + Compose v2).
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
docker compose version >/dev/null
docker compose up -d --build
docker compose ps
# CLOCK_PORT is read by Compose from .env; read it here only to print the address.
port="$(grep -E '^CLOCK_PORT=' .env 2>/dev/null | tail -n 1 | cut -d= -f2 || true)"
echo "Open http://localhost:${port:-${CLOCK_PORT:-6140}}"
