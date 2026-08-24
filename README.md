# AI Revenue Recovery Platform

> **AI recommends. Policy authorizes. Workflow executes. Payment system acts. Audit records. Analytics measures. ML learns.**

A production-grade prototype that detects merchant revenue at risk, predicts whether it is recoverable, uses ML + an AI agent to recommend an intervention, validates that recommendation against deterministic financial policy, executes a durable recovery workflow, and measures the money actually recovered — with a complete audit trail throughout.

Built for the **Razorpay Buildathon — Track 3: AI Revenue Recovery**.

📄 **[`PROJECT_SPEC.md`](./PROJECT_SPEC.md) is the canonical source of truth** for scope, architecture, and phases. This README is the operational entry point for the repository.

---

## What it does

Every recovery follows one lifecycle:

```
DETECT → UNDERSTAND → PREDICT → DECIDE → AUTHORIZE → EXECUTE → MEASURE → LEARN
```

The first complete vertical slice is **Failed Payment Recovery**: a payment fails, the platform opens a recovery case, an ML model scores its recoverability, an AI agent recommends an action (retry, remind, request a payment-method update, escalate, or stop), the policy engine authorizes or rejects it, and a Temporal workflow executes the approved action and observes the result — stopping on success, re-evaluating on failure, and verifying before acting on any unknown state.

The central design rule is that **AI intelligence is never wired directly to money movement**. AI proposes; deterministic policy authorizes; a durable workflow executes; only the payment service acts.

---

## Monorepo layout

Turborepo + pnpm workspaces. TypeScript services live under `apps/`, Python services under `services/`.

| Path              | Contents                                                                                                     | Status                |
| ----------------- | ------------------------------------------------------------------------------------------------------------ | --------------------- |
| `apps/`           | TypeScript/NestJS services + Next.js dashboard (`web`)                                                       | `web` scaffolded      |
| `packages/`       | Shared TS packages (`ui`, `eslint-config`, `typescript-config`; later `contracts`, `config`, `telemetry`, …) | base packages present |
| `services/`       | Python services: `ai-agent`, `ml-inference`, `simulation-engine`                                             | placeholder           |
| `ml/`             | Model `training`, `evaluation`, `experiments`, `models`                                                      | placeholder           |
| `simulator/`      | Synthetic world + ground-truth generation                                                                    | placeholder           |
| `infrastructure/` | Docker, Kafka, Postgres, Redis, Temporal, monitoring configs                                                 | placeholder           |
| `docs/`           | `architecture`, `decisions` (ADRs), `api`, `evaluation`                                                      | placeholder           |

Directories marked _placeholder_ currently hold a `.gitkeep` and are filled in during the phase that owns them (see `PROJECT_SPEC.md` §20).

---

## Tech stack

- **Frontend:** Next.js, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query
- **Backend services:** NestJS, TypeScript, Prisma
- **AI / ML:** Python, FastAPI, scikit-learn, XGBoost, MLflow, an LLM provider with tool calling / structured outputs
- **Messaging:** Apache Kafka
- **Workflows:** Temporal
- **Data:** PostgreSQL (transactional truth + audit), Redis (locks / idempotency / cache), ClickHouse (analytics), S3-compatible object storage (MinIO)
- **Observability:** OpenTelemetry, Prometheus, Grafana, Loki, Tempo
- **Infra:** Docker, Docker Compose, Kubernetes
- **Testing:** Jest, Pytest, Playwright, k6

Technology is only changed with a documented reason (recorded as an ADR in `docs/decisions/`).

---

## Prerequisites

- **Node.js ≥ 20** (repo is developed on Node 22)
- **pnpm 10.x** — the version is pinned in `package.json` and managed via **Corepack**:
  ```bash
  corepack enable
  ```
- **Python 3.11+** — for `services/`, `ml/`, `simulator/` (needed from the AI/ML phase onward)
- **Docker + Docker Compose** — for local infrastructure (needed from the workflow/event phase onward)

---

## Getting started

```bash
# 1. Enable the pinned package manager
corepack enable

# 2. Install workspace dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env
# then edit .env and fill in any secrets (e.g. LLM_API_KEY)

# 4. Start the dev pipeline (all workspaces with a `dev` task)
pnpm dev
```

---

## Root scripts

Run from the repository root; each fans out across the workspace via Turborepo.

| Script              | What it does                                  |
| ------------------- | --------------------------------------------- |
| `pnpm dev`          | Run every workspace's `dev` task (watch mode) |
| `pnpm build`        | Build all workspaces                          |
| `pnpm lint`         | Lint all workspaces                           |
| `pnpm typecheck`    | Type-check all workspaces                     |
| `pnpm test`         | Run all workspace tests                       |
| `pnpm format`       | Format code with Prettier                     |
| `pnpm format:check` | Check formatting without writing changes      |
| `pnpm clean`        | Remove build artifacts / caches               |

---

## Environment

Environment configuration follows a simple, explicit strategy:

- **`.env.example`** (committed) is the canonical list of every variable the platform expects. It contains no real secrets.
- **`.env`** (git-ignored) holds your local values — copy it from `.env.example`.
- **Per-service `.env.local`** (git-ignored) overrides root values for an individual app or service.
- **Secrets are never committed.** `.gitignore` ignores all `.env*` files except `.env.example`.

Typed loading and validation of these variables will live in a shared `packages/config` package as services come online.

---

## Project status

Early **Phase 0 (Architecture)**. The repository scaffold, workspace tooling, and documentation are being established before feature work begins. Development proceeds phase-by-phase, one component at a time; the full phase plan is in `PROJECT_SPEC.md` §20.

## Documentation

- **[`PROJECT_SPEC.md`](./PROJECT_SPEC.md)** — canonical specification
- **`docs/architecture/`** — system and service design
- **`docs/decisions/`** — Architecture Decision Records (ADRs)
- **`docs/api/`** — service/API contracts
- **`docs/evaluation/`** — evaluation methodology and results
