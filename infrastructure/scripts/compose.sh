#!/usr/bin/env bash
# =============================================================================
# compose.sh — thin wrapper around `docker compose` for the local dev stack.
#
# Why this exists:
#   * Pins the compose file location regardless of the caller's CWD.
#   * Sets --project-directory to the REPO ROOT so that the root-level `.env`
#     is auto-loaded and the compose project name/paths are stable.
#
# Usage:
#   infrastructure/scripts/compose.sh up -d --wait
#   infrastructure/scripts/compose.sh ps
#   infrastructure/scripts/compose.sh exec -T postgres pg_isready
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/../docker-compose.yml"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

if ! command -v docker >/dev/null 2>&1; then
  echo "error: 'docker' is not installed or not on PATH." >&2
  echo "       Install Docker Desktop (or the Docker Engine) and retry." >&2
  exit 127
fi

# `docker compose` (v2) is required; the legacy `docker-compose` v1 is not used.
if ! docker compose version >/dev/null 2>&1; then
  echo "error: 'docker compose' (v2) is unavailable. Update Docker to a v2 CLI." >&2
  exit 127
fi

exec docker compose -f "$COMPOSE_FILE" --project-directory "$ROOT_DIR" "$@"
