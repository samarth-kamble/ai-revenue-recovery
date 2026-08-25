# Library & Dependency Context

This file records the technology decisions so AI coding tools do not repeatedly make different choices.

## Runtime

### Node.js
Purpose: JavaScript/TypeScript runtime.

Version:
- Pin in project configuration.

### TypeScript
Purpose: primary application language.

Rules:
- strict mode,
- shared types only where useful,
- no `any` as an escape hatch.

## Backend

### NestJS
Purpose:
- API,
- application services,
- dependency injection,
- validation,
- module boundaries.

Do not create one NestJS module for every tiny concept. Group by meaningful business capability.

## Frontend

### Next.js
Purpose:
- merchant dashboard,
- server/client UI where appropriate.

Frontend must never be trusted for authorization.

## Database

### PostgreSQL
Purpose:
- transactional source of truth,
- payments,
- recovery cases,
- decisions,
- policies,
- audit records.

### Prisma
Purpose:
- schema,
- migrations,
- type-safe database access.

Money uses Decimal.

## AI

Use an LLM provider through a small application boundary.

The rest of the application should depend on an internal interface such as:

```text
RecoveryAgent
  generateRecommendation(context)
```

This prevents provider-specific code from spreading through the domain.

## ML

The ML model should have a stable interface:

```text
predict(features)
→ recoveryProbability
→ modelVersion
```

The model implementation may be local or a separate service depending on later requirements.

## Infrastructure

Kafka:
- only when asynchronous event streaming is justified.

Temporal:
- only when durable long-running recovery workflows justify it.

Redis:
- only for a demonstrated caching/coordination need.

Do not add all three automatically.

## Dependency Rule

When adding a library, update this file with:
- package name,
- purpose,
- version,
- why it is required,
- relevant official documentation.
