# Local Development Infrastructure

The foundation stack for local development: **PostgreSQL** (transactional source
of truth + audit) and **Redis** (distributed locks, idempotency keys, cache).
Kafka, Temporal, ClickHouse, and object storage are intentionally **not** here
yet — each is added in the phase that owns it (see `PROJECT_SPEC.md` §20).

> These credentials are for **local development only**. Never reuse them in any
> shared or production environment.

## Prerequisites

- **Docker Desktop** (or Docker Engine) with the **`docker compose` v2** CLI.

That is the only requirement — the connectivity checks run inside the containers,
so you do not need `psql` or `redis-cli` installed on your host.

## Quick start

Run everything from the **repository root**:

```bash
# 1. (optional) create your local env file; sensible defaults apply without it
cp .env.example .env

# 2. start the stack and wait until both services report healthy
pnpm infra:up

# 3. verify connectivity (explicit PASS/FAIL readout)
pnpm infra:check
```

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm infra:up` | Start Postgres + Redis in the background and **wait** until both are healthy (`up -d --wait`). |
| `pnpm infra:check` | Run connectivity checks: `pg_isready` + `SELECT 1`, and Redis `PING` + a set/get round-trip. |
| `pnpm infra:ps` | Show container status and health. |
| `pnpm infra:logs` | Tail logs from both services (`Ctrl-C` to stop). |
| `pnpm infra:down` | Stop and remove the containers. **Data is preserved** in named volumes. |
| `pnpm infra:reset` | Stop and remove containers **and volumes** — this destroys all local data. |

All scripts delegate to `infrastructure/scripts/compose.sh`, which pins the
compose file and sets the compose project directory to the repo root so the
root-level `.env` is loaded automatically.

## Services

| Service | Image | Host port | Purpose |
| --- | --- | --- | --- |
| `postgres` | `postgres:16-alpine` | `5432` | Transactional data + audit trail |
| `redis` | `redis:7-alpine` | `6379` | Locks, idempotency keys, cache |

### Connection details (defaults)

These come from `.env.example` and are the inline defaults in the compose file,
so the stack works even before you create a `.env`:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/revenue_recovery
REDIS_URL=redis://localhost:6379
```

Redis runs with `--appendonly yes`, so idempotency keys survive a container
restart. Postgres and Redis each persist to a named Docker volume
(`revenue-recovery-pgdata`, `revenue-recovery-redisdata`).

## Configuration

Every value is overridable via the root `.env` (copy it from `.env.example`).
The most useful overrides:

| Variable | Default | Notes |
| --- | --- | --- |
| `POSTGRES_PORT` | `5432` | Change if `5432` is already in use on your machine. |
| `REDIS_PORT` | `6379` | Change if `6379` is already in use. |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | `postgres` / `postgres` / `revenue_recovery` | Local dev credentials. |

## Troubleshooting

- **`port is already allocated`** — you already have Postgres/Redis running
  locally. Either stop it, or set `POSTGRES_PORT` / `REDIS_PORT` in `.env` to a
  free port and re-run `pnpm infra:up`.
- **`infra:check` fails right after `infra:up`** — the check retries for a while;
  if it still fails, inspect `pnpm infra:ps` and `pnpm infra:logs`.
- **Stale data / want a clean slate** — `pnpm infra:reset` removes the volumes,
  then `pnpm infra:up` recreates them empty.
- **`docker: command not found`** — install Docker Desktop and ensure the
  `docker compose` v2 CLI is available (`docker compose version`).

## What's not here yet

No database schema, migrations, or seed data — the databases come up empty.
Schema management (Prisma) and event/workflow infrastructure (Kafka, Temporal)
arrive in their respective later phases. This directory only provides the
running data services those phases will build on.
