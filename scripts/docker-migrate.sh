#!/usr/bin/env bash
# Run Prisma migrations against MySQL from docker-compose (service hostname: mysql).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
exec docker compose run --rm migrate
