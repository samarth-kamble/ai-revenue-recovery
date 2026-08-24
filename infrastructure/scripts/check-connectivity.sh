#!/usr/bin/env bash
# =============================================================================
# check-connectivity.sh — verify the local dev infrastructure is reachable.
#
# Dependency-free: it uses each container's OWN tooling (pg_isready, psql,
# redis-cli) via `docker compose exec`, so it needs nothing installed on the
# host beyond Docker itself. Safe to run repeatedly.
#
# Exit codes:  0 = all checks passed   1 = one or more failed   127 = no docker
#
# Tunables (env):  RETRIES (default 15)   SLEEP seconds (default 2)
# =============================================================================
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE="$SCRIPT_DIR/compose.sh"

# Load root .env (if present) so credentials match what compose used.
if [ -f "$ROOT_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$ROOT_DIR/.env"
  set +a
fi

PG_USER="${POSTGRES_USER:-postgres}"
PG_DB="${POSTGRES_DB:-revenue_recovery}"
RETRIES="${RETRIES:-15}"
SLEEP="${SLEEP:-2}"

pass=0
fail=0
ok()  { printf '  [OK]   %s\n' "$*"; pass=$((pass + 1)); }
bad() { printf '  [FAIL] %s\n' "$*"; fail=$((fail + 1)); }

dc() { bash "$COMPOSE" "$@"; }

# Retry a command silently until it succeeds or RETRIES is exhausted.
retry() {
  local n=0
  until dc "$@" >/dev/null 2>&1; do
    n=$((n + 1))
    [ "$n" -ge "$RETRIES" ] && return 1
    sleep "$SLEEP"
  done
  return 0
}

if ! command -v docker >/dev/null 2>&1; then
  echo "error: 'docker' is not installed or not on PATH." >&2
  exit 127
fi

echo "Checking local infrastructure connectivity (up to $((RETRIES * SLEEP))s per service)..."
echo ""

# --- PostgreSQL ------------------------------------------------------------
echo "PostgreSQL:"
if retry exec -T postgres pg_isready -U "$PG_USER" -d "$PG_DB"; then
  ok "pg_isready — server is accepting connections"
  if dc exec -T postgres psql -U "$PG_USER" -d "$PG_DB" -tAc 'SELECT 1;' >/dev/null 2>&1; then
    ok "psql 'SELECT 1' — query round-trip succeeded"
  else
    bad "psql 'SELECT 1' — connected but query failed (check credentials/DB)"
  fi
else
  bad "pg_isready — not reachable (is the stack up? run: pnpm infra:up)"
fi
echo ""

# --- Redis -----------------------------------------------------------------
echo "Redis:"
if retry exec -T redis redis-cli ping; then
  reply="$(dc exec -T redis redis-cli ping 2>/dev/null | tr -d '\r\n')"
  if [ "$reply" = "PONG" ]; then
    ok "redis-cli ping — PONG"
  else
    bad "redis-cli ping — unexpected reply: '$reply'"
  fi
  if dc exec -T redis redis-cli set __healthcheck__ ok >/dev/null 2>&1 &&
    [ "$(dc exec -T redis redis-cli get __healthcheck__ 2>/dev/null | tr -d '\r\n')" = "ok" ]; then
    dc exec -T redis redis-cli del __healthcheck__ >/dev/null 2>&1 || true
    ok "set/get round-trip — value written and read back"
  else
    bad "set/get round-trip — failed"
  fi
else
  bad "redis-cli ping — not reachable (is the stack up? run: pnpm infra:up)"
fi
echo ""

echo "-------------------------------------------------------------"
echo "Connectivity summary: ${pass} passed, ${fail} failed"
if [ "$fail" -gt 0 ]; then
  echo "Result: FAIL — some services are not reachable."
  exit 1
fi
echo "Result: OK — all infrastructure is reachable."
