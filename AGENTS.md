---
description: AI Revenue Recovery Platform agent instructions
globs: *
alwaysApply: true
---

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Read Before Anything Else

Read in this exact order before any implementation:

1. context/ai-instructions.md
2. context/project-overview.md
3. context/architecture.md
4. context/ui-tokens.md
5. context/ui-rules.md
6. context/ui-registry.md
7. context/code-standards.md
8. context/library-docs.md
9. context/build-plan.md
10. context/progress-tracker.md
11. PROJECT_SPEC.md

## Rules That Never Change

- Build one verified slice at a time (Tracer Bullet approach).
- Protected APIs require server-side authentication and tenant isolation (`merchantId`).
- LLM outputs are untrusted: always validate schema and apply policy checks before actions.
- Financial Safety: Never execute direct charges from LLM recommendations without policy & validation.
- Update `context/progress-tracker.md` after completing each feature or vertical slice.
- Before using any third-party library — read `context/library-docs.md` for project-specific rules.
- All code changes must pass linting, typechecking, and tests before declaring completion.

## Available Skills

- `/architect` — Design features, tech stack decisions, and build specs before complex implementations.
- `/audit` — Audit AI context and maintain `AGENTS.md` files across the codebase.
- `/check` — Confirm changes, drive end-to-end verification, and run code reviews before PRs.
- `/debug` — Find and fix root causes of failures systematically using a reproduce-localize-fix loop.
- `/develop` — Implement features and components according to approved specs and scope.
- `/document` — Draft PRs, changelogs, release notes, and postmortems.
- `/scope` — Product scope management, feature slice planning, and progress reconciliation.
- `/sync` — Synchronize durable knowledge and reconcile repository state after changes.
- `/test` — Generate comprehensive unit and integration test suites.

# AI Revenue Recovery Platform Overview

## Stack & Infrastructure

- **Language / Runtime**: TypeScript (Node.js 20+)
- **Framework**: NestJS, Turborepo (`pnpm` monorepo)
- **Database & Cache**: PostgreSQL (Prisma ORM), Redis
- **Testing**: Vitest
- **Package Manager**: `pnpm`

## Daily Development Commands

```bash
# Install dependencies
pnpm install

# Run development servers across monorepo
pnpm turbo dev

# Build all packages and applications
pnpm turbo build

# Run unit and integration tests
pnpm turbo test

# Format & Lint
pnpm turbo lint
```

## Core Safety & Architectural Principles

### 1. Financial Safety
Never execute direct charges from LLM recommendations. Always follow:
`LLM Recommendation` → `Schema Validation` → `Policy Check` → `Approved Workflow` → `Payment Action`

### 2. AI Safety & Guardrails
Treat model outputs as untrusted input. Validate schemas strictly via Zod/DTOs before invoking business logic or database operations.

### 3. Multi-Tenant Isolation
All data operations must enforce `merchantId` filtering server-side. Never rely on client-supplied merchant identifiers without backend session verification.

---
_Drafted for AI Revenue Recovery Platform. Edit freely._
