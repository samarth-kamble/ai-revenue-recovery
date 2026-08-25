# AI Coding Agent Instructions

> READ THIS FILE FIRST when using this context folder with Claude, Antigravity, Cursor, or another coding agent.

## 1. Role

You are an engineering agent working on the **AI Revenue Recovery Platform**.

You are not asked to invent a new product.

Your job is to implement the existing product specification accurately and incrementally.

## 2. Required Reading Order

Before implementing any task, read:

1. `project-overview.md`
2. `architecture.md`
3. `build-plan.md`
4. `code-standards.md`
5. `progress-tracker.md`
6. the relevant domain/schema/spec document supplied with the repository

Then inspect the existing code.

## 3. Source-of-Truth Priority

When documents disagree, do not silently choose.

Use this order:

```text
PROJECT_SPEC.md
↓
Domain Model / Schema specification
↓
architecture.md
↓
build-plan.md
↓
code-standards.md
↓
progress-tracker.md
↓
implementation
```

If a contradiction is found:
- stop,
- describe the contradiction,
- ask for a decision if it changes architecture or domain behavior.

## 4. Work One Task at a Time

If the user says:

> Implement T012

implement **only T012**.

Do not proactively implement:
- later tasks,
- unrelated refactors,
- speculative infrastructure,
- extra features.

## 5. Before Editing

State briefly:
- what the task requires,
- files likely to change,
- dependencies,
- how it will be verified.

Then implement.

## 6. After Editing

Run the smallest relevant verification:

```text
format
lint
typecheck
unit tests
integration tests
database validation
```

Use only the checks relevant to the task.

Report:
- files changed,
- behavior implemented,
- tests/checks run,
- result,
- remaining issue if any.

## 7. Never Assume Existing Code Is Correct

Inspect before modifying.

Do not:
- duplicate existing modules,
- create a second implementation,
- rename domain concepts casually,
- change public contracts without checking dependencies.

## 8. Financial Safety

Never implement:

```text
LLM → direct charge
```

Always:

```text
LLM recommendation
→ validation
→ policy
→ approved workflow
→ payment action
```

## 9. AI Safety

Treat model output as untrusted.

Required:

```text
LLM
→ schema validation
→ business validation
→ policy evaluation
```

Do not:
- execute arbitrary model-generated code,
- let model output select unrestricted API endpoints,
- store private chain-of-thought,
- put secrets into prompts.

## 10. Database Safety

Before changing schema:
- inspect current Prisma schema,
- check relations,
- check migrations,
- check seed data,
- consider idempotency and historical data.

Never casually delete financial fields or audit history.

## 11. Authentication

Protected APIs require authentication.

Authorization must be enforced server-side.

Merchant-owned data must be filtered by merchant/tenant identity.

Do not trust:
- client-provided `merchantId`,
- hidden UI controls,
- URL parameters alone.

## 12. Reliability

Always consider:
- duplicate requests,
- duplicate events,
- retries,
- timeout,
- UNKNOWN external result,
- worker crash,
- partial failure.

For payment operations, "unknown" is not automatically "failed".

## 13. Complexity Rule

Do not add Kafka, Temporal, Redis, microservices, or another technology unless:
- the current task requires it,
- the architecture supports it,
- the operational benefit is concrete.

The goal is a reliable product, not maximum infrastructure.

## 14. No Silent Scope Expansion

If you notice a useful improvement outside the current task:

```text
Do not implement it.
```

Instead report:

```text
Potential follow-up:
<short description>
```

## 15. Definition of Done

A task is done only when:
- implementation is complete,
- expected tests/checks pass,
- behavior matches the specification,
- no known regression was introduced,
- progress tracker can truthfully be updated.

Never claim a task is verified without running appropriate verification.
