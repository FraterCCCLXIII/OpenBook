#!/usr/bin/env bash
# Bring up docker-compose services and sanity-check HTTP + DB.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Avoid hanging forever if the Docker socket is wedged (e.g. stuck `docker compose` runs).
docker_timeout() {
  local secs=$1
  shift
  "$@" &
  local pid=$!
  (sleep "$secs"; kill -9 "$pid" 2>/dev/null) &
  local killer=$!
  wait "$pid"
  local ec=$?
  kill "$killer" 2>/dev/null || true
  return "$ec"
}

echo "OpenBook stack: checking Docker (25s timeout)..."
if ! docker_timeout 25 docker info >/dev/null 2>&1; then
  echo "Docker did not respond. Start Docker Desktop (or the daemon), then retry."
  echo "If it stays stuck, quit stuck terminals or run: pkill -f 'docker compose run'"
  exit 1
fi

echo "Starting compose services (MySQL, Redis, Mailpit)..."
docker_timeout 120 docker compose up -d

echo ""
echo "Container status:"
docker compose ps

echo ""
echo "Waiting for MySQL (up to ~60s)..."
ok=0
for _ in $(seq 1 30); do
  if docker compose exec -T mysql mysqladmin ping -h localhost -uopenbook -popenbook --silent 2>/dev/null; then
    ok=1
    break
  fi
  sleep 2
done

if [[ "$ok" -ne 1 ]]; then
  echo "MySQL did not become ready in time. Check: docker compose logs mysql"
  exit 1
fi
echo "MySQL: OK"

echo ""
echo "HTTP checks (API on :3002, web on :5173):"
code_health=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 http://127.0.0.1:3002/api/health || echo "000")
code_db=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 http://127.0.0.1:3002/api/settings/public || echo "000")
code_web=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 http://127.0.0.1:5173/ || echo "000")

echo "  GET /api/health          -> HTTP $code_health  (expect 200)"
echo "  GET /api/settings/public -> HTTP $code_db     (expect 200 when DB is connected)"
echo "  GET / (Vite)             -> HTTP $code_web     (expect 200)"

if [[ "$code_health" == "000" ]]; then
  echo ""
  echo "API is not listening on :3002. Start it from the repo root:"
  echo "  pnpm dev"
  exit 1
fi

if [[ "$code_db" != "200" ]]; then
  echo ""
  echo "API is up but the database route failed (often stale connections after MySQL was down). Restart the API:"
  echo "  pnpm dev"
  echo "Or run migrations on a fresh volume: docker compose run --rm migrate"
  exit 1
fi

echo ""
echo "All checks passed."
