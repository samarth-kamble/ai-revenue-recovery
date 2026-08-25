# ADR-002: Vitest for TypeScript testing (deviates from spec's Jest)

- **Status:** Accepted
- **Date:** 2026-08-25
- **Deciders:** Setup decision during Phase 0 tooling (T002); confirmed with the maintainer
- **Related:** [`PROJECT_SPEC.md` §7 (Technology Stack — lists Jest)](../../PROJECT_SPEC.md), [ADR-001](./ADR-001-monorepo-turborepo-pnpm.md)

## Context

`PROJECT_SPEC.md` §7 lists **Jest** as the TypeScript test runner. When wiring up
test tooling (task T002), the scaffold already in place made Jest a poor fit:
every workspace is native ESM (`"type": "module"`), the web app targets Next.js 16

- React 19, and Jest's ESM support still depends on transform/Babel config plus
  `NODE_OPTIONS=--experimental-vm-modules`, which is fragile across a monorepo of
  ESM packages. This is a **deliberate deviation from the spec**, recorded here per
  the ADR policy (§7, §21, §22).

## Decision

We will use **Vitest** as the test runner for all **TypeScript** unit and
integration tests, in place of the Jest entry in the spec.

- Vitest is pinned at the root and used by workspaces via a `test: "vitest run"`
  script (already in place in `apps/web` and `packages/config`).
- The `turbo test` task fans these out from the root.
- Scope is **TypeScript testing only**: Python keeps **pytest**, end-to-end keeps
  **Playwright**, and load testing keeps **k6**, exactly as the spec describes.

## Alternatives

- **Jest** — the runner named in the spec.
- **node:test** — the built-in Node test runner, zero dependencies.

## Reason

Vitest is ESM-native, so it runs the packages as-authored with essentially no
transform configuration, and it exposes a Jest-compatible API
(`describe`/`it`/`expect`) so the spec's testing intent carries over directly.
Jest would demand ongoing ESM transform/config maintenance for a fully-ESM,
Next 16 / React 19 monorepo. `node:test` avoids a dependency but has weaker DX
(watch, mocking, coverage, IDE integration) for this stack.

## Trade-offs

- A documented divergence from `PROJECT_SPEC.md` §7 that future readers must
  reconcile against the spec — this ADR is that reconciliation.
- Jest-specific plugins/matchers are not all 1:1; anything ported from Jest must
  be checked against Vitest equivalents.

## Consequences

- Test scripts standardize on `vitest run`; contributors use Vitest APIs for TS.
- Two test ecosystems remain in the repo (Vitest for TS, pytest for Python) —
  expected for a polyglot monorepo, but two toolchains to keep current.
- The spec's §7 Jest reference is superseded for TypeScript by this ADR; no other
  testing layer is affected.
