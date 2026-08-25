# @workspace/database

The transactional data layer for the AI Revenue Recovery Platform. This package
owns the Prisma schema, the generated client, and the migration history for the
PostgreSQL database that serves as the platform's source of truth (and its
append-only audit trail).

Every service that reads or writes relational state does so through the client
exported here — no service talks to Postgres directly. Keeping the schema in one
package means the data model, its constraints, and its migrations evolve
together and stay reviewable in one place.

## What lives here

```
packages/database/
├── prisma/
│   ├── schema.prisma                     # the data model — single source of truth
│   └── migrations/
│       ├── migration_lock.toml           # pins the provider to postgresql
│       └── 20260824194737_init/
│           └── migration.sql             # initial migration (all 11 tables)
├── src/
│   ├── client.ts                         # PrismaClient singleton
│   └── index.ts                          # public exports
├── package.json
└── tsconfig.json
```

The package is consumed as TypeScript source (its `exports` point at `./src/*`),
matching the convention used by the other `@workspace/*` packages.

## The data model

The schema implements the "approved entities" for the Failed Payment Recovery
vertical slice, grounded directly in `PROJECT_SPEC.md` — the service boundaries
(§8), the AI decision architecture (§9), the policy engine (§10), the event
architecture (§12), and the audit trail (§14). It defines nine enums and the
following eleven models:

| Model            | Role                                                                       |
| ---------------- | -------------------------------------------------------------------------- |
| `Customer`       | The party whose payments may need recovery; source of AI feature context.  |
| `Payment`        | A payment and its current lifecycle state.                                 |
| `PaymentAttempt` | One attempt to charge a payment; retries create new attempts.              |
| `RevenueRisk`    | "How much is at stake?" — created by the Revenue Detection Service.        |
| `RecoveryCase`   | The unit orchestrated through the 8-stage recovery lifecycle.              |
| `MLPrediction`   | A recovery-probability prediction from the ML Inference Service.           |
| `AIDecision`     | A structured **recommendation** from the AI agent — advisory only.         |
| `PolicyDecision` | A **deterministic** ALLOWED/DENIED authorization that overrides the AI.    |
| `RecoveryAction` | An intervention that executes — created only from an ALLOWED policy.       |
| `Notification`   | A simulated customer notification; counts toward the policy limit.         |
| `AuditEvent`     | Append-only audit record mirroring the §14 field list.                     |

### Design guardrails baked into the schema

These are not incidental — they encode the platform's core safety properties and
should survive every future migration:

- **The money-movement boundary (§5.1).** The AI layer only *records* what it
  produced (`MLPrediction`, `AIDecision`). Authorization (`PolicyDecision`) is a
  separate, deterministic step, and execution (`RecoveryAction`) exists only
  downstream of an `ALLOWED` policy decision. No table lets the AI act on money
  directly; the ordering `recommend → authorize → execute` is modeled in the
  relations themselves.
- **Auditability (§5.3, §14).** `AuditEvent` is append-only — it has no
  `updatedAt`, and its foreign keys are optional so the history survives even if
  a referenced row is later removed.
- **Monetary correctness.** All money (`amount`, `amountAtRisk`) uses
  `Decimal(12,2)`, never a floating-point type. The only `Float` columns are
  probabilities (`recoveryProbability`, `confidence`).
- **No fabricated taxonomies.** `failureReason` is a free-form `String` because
  the spec does not enumerate reason codes — inventing an enum here would be a
  fabricated metric surface.

Analytics aggregate tables (Phase 6–7) and Simulation/ground-truth tables
(Phase 5) are intentionally **not** in this schema yet; their shapes are defined
by later phases.

## Using the client

```ts
import { prisma } from "@workspace/database"

const openCases = await prisma.recoveryCase.findMany({
  where: { status: "OPEN" },
})
```

Prisma-generated types and enums are re-exported too, so consumers import
everything from one place:

```ts
import { prisma, RecoveryCaseStatus, type RecoveryCase } from "@workspace/database"
```

`src/client.ts` caches a single `PrismaClient` on `globalThis` in non-production
environments to avoid exhausting connections during hot-reload.

## Commands

Run from the repo root (delegates via `pnpm --filter @workspace/database`) or
from inside `packages/database`:

| Root script            | What it does                                              |
| ---------------------- | --------------------------------------------------------- |
| `pnpm db:generate`     | Regenerate the Prisma client from the schema.             |
| `pnpm db:migrate`      | Create/apply a dev migration (`prisma migrate dev`).      |
| `pnpm db:migrate:deploy` | Apply pending migrations in CI/production.              |
| `pnpm db:migrate:status` | Show which migrations are applied vs. pending.          |
| `pnpm db:validate`     | Validate the schema without touching the database.        |
| `pnpm db:studio`       | Open Prisma Studio to browse data.                        |
| `pnpm db:reset`        | **Destructive** — drop, recreate, and re-apply migrations.|

## First-time setup

The database connection comes from `DATABASE_URL` (see the repo-root
`.env.example`); it defaults to the local docker-compose Postgres:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/revenue_recovery
```

From a clean checkout on a machine with Docker + pnpm:

```bash
cp .env.example .env            # from repo root
pnpm install                    # installs deps; postinstall runs `prisma generate`
pnpm infra:up                   # start Postgres + Redis
pnpm db:migrate:status          # verify the init migration is detected
pnpm db:migrate                 # apply the initial migration
```

> **Note on the initial migration.** `migration.sql` was authored to match
> Prisma's own migration output exactly (naming, referential actions, index
> conventions) and cross-checked against the schema table-by-table. On first run,
> confirm it applies cleanly with `pnpm db:migrate:status` before relying on it;
> if Prisma reports drift, regenerate with `pnpm db:migrate` against an empty
> database and commit the result.
