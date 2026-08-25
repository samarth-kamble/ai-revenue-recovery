# ADR-001: Monorepo on Turborepo + pnpm workspaces

- **Status:** Accepted
- **Date:** 2026-08-25
- **Deciders:** Ratifies `PROJECT_SPEC.md` §7 during Phase 0 setup
- **Related:** [`PROJECT_SPEC.md` §7 (Technology Stack)](../../PROJECT_SPEC.md), [§19 (Repository Structure)](../../PROJECT_SPEC.md)

## Context

The platform is polyglot and multi-service: TypeScript applications and services
under `apps/`, shared TypeScript packages under `packages/`, and Python services
(ML, simulation) managed separately. These components share contracts,
configuration, linting, and type settings, and need to be developed and built
together with consistent tooling. `PROJECT_SPEC.md` §7 already specifies a
monorepo managed with Turborepo and pnpm; this ADR records and ratifies that
choice.

## Decision

We will use a **single monorepo** managed with **Turborepo** for task
orchestration/caching and **pnpm workspaces** for dependency management.

- Workspace globs: `apps/*` and `packages/*` (see `pnpm-workspace.yaml`).
- pnpm is pinned via `packageManager` in the root `package.json` and provisioned
  through Corepack.
- Cross-package references use the `workspace:*` protocol; shared config is
  published as internal packages (`@workspace/eslint-config`,
  `@workspace/typescript-config`, and later `@workspace/config`, etc.).
- Python components live in the same repository but are managed by their own
  Python tooling, not by pnpm.

## Alternatives

- **Nx** — richer generators and project-graph tooling.
- **Bazel** — hermetic, polyglot builds at scale.
- **Polyrepo** — one repository per service.
- **npm / yarn workspaces** — the other JS workspace managers.

## Reason

Turborepo + pnpm is what the spec prescribes and is sufficient here: one source
of truth, atomic cross-cutting changes, a single lockfile, and a cached task
graph that fans `lint`/`typecheck`/`test`/`build` out from the root. Nx and Bazel
add generator/hermeticity power we do not need at prototype scale and cost more to
maintain. A polyrepo would fragment the shared contracts and tooling and make
atomic changes across services painful. npm/yarn workspaces are viable, but
pnpm's disk efficiency and strict resolution are preferred and match the spec.

## Trade-offs

- Requires pnpm 10 via Corepack in every environment (local and CI/deploy); hosts
  that default to another package manager need explicit configuration.
- `workspace:*` dependencies only resolve when install runs from the repo root
  with the workspace intact — a known footgun for isolated per-app deploys.

## Consequences

- Shared internal config packages become the home for lint/TS/test settings.
- Deploys must build from the repo root (e.g. `turbo build --filter=web`) rather
  than from an isolated app directory; this shapes the later deploy setup.
- CI and any hosting platform must enable Corepack/pnpm 10 and Node ≥20.
