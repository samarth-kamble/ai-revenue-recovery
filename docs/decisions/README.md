# Architecture Decision Records (ADRs)

An ADR captures a single significant architectural decision: the context that
forced it, the decision made, and the consequences accepted. ADRs are immutable
once accepted — if a decision changes, write a new ADR that supersedes the old
one rather than editing history.

## Why we keep ADRs

[`PROJECT_SPEC.md`](../../PROJECT_SPEC.md) is the canonical architecture, and it
requires that **technology and design choices only change for a documented
reason** (§7, §21). ADRs are that record. In particular, any deviation from the
spec (a different library, a changed boundary) must be justified in an ADR.

## When to write one

Write an ADR when a choice is costly to reverse or shapes later work: choosing or
replacing a core technology, defining or moving a service boundary, adopting a
cross-cutting pattern (idempotency, outbox, audit), or **deviating from
`PROJECT_SPEC.md`**. Skip ADRs for routine, easily-reversible implementation
details.

## Conventions

Following [`PROJECT_SPEC.md` §22](../../PROJECT_SPEC.md):

- **Filename:** `ADR-NNN-kebab-case-title.md`, three-digit zero-padded and
  monotonically increasing (e.g. `ADR-003-outbox-pattern.md`).
- **Body sections:** `Context`, `Decision`, `Alternatives`, `Reason`,
  `Trade-offs`, `Consequences` — in that order.
- **Numbering:** never reused, even if an ADR is later superseded.
- **Status lifecycle:** `Proposed → Accepted → (Superseded | Deprecated)`.
- Start from [`adr-template.md`](./adr-template.md).

## Index

| ADR | Title | Status |
| --- | --- | --- |
| [ADR-001](./ADR-001-monorepo-turborepo-pnpm.md) | Monorepo on Turborepo + pnpm workspaces | Accepted |
| [ADR-002](./ADR-002-vitest-over-jest.md) | Vitest for TypeScript testing (deviates from spec's Jest) | Accepted |
