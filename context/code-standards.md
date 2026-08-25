# Code Standards — AI Revenue Recovery Platform

## 1. General

Write code that another engineer can safely modify.

Prefer:
- simple code,
- explicit names,
- small functions,
- clear module boundaries,
- deterministic behavior,
- tests around business rules.

Avoid:
- speculative abstractions,
- giant services,
- hidden side effects,
- duplicated business rules,
- premature microservices.

## 2. TypeScript

- `strict: true`
- Avoid `any`.
- Avoid unsafe type assertions.
- Define interfaces/types for domain boundaries.
- Validate all external data.
- Prefer discriminated unions for stateful results.

## 3. Naming

Use business terminology consistently.

Correct:
- `RecoveryCase`
- `RecoveryAction`
- `PolicyDecision`
- `recoveryProbability`

Do not invent alternative names such as:
- `RecoveryJob`
- `RiskThing`
- `AIResult`

unless the domain model explicitly changes.

## 4. Backend Layering

Recommended:

```text
Controller
   ↓
Application Service / Use Case
   ↓
Domain Logic
   ↓
Repository / Infrastructure
```

Controllers should not contain business rules.

## 5. Financial Logic

Money:
- use Decimal/fixed precision,
- never use binary floating point for monetary persistence,
- include currency,
- never silently round.

Financial actions:
- must be idempotent,
- must have a traceable request,
- must respect policy,
- must be auditable.

## 6. State Machines

Do not update statuses arbitrarily.

A transition must:
1. validate current state,
2. validate requested transition,
3. perform the transition,
4. emit the relevant event,
5. preserve auditability.

## 7. AI

AI output is untrusted external input.

Pipeline:

```text
LLM
 ↓
Schema validation
 ↓
Business validation
 ↓
Policy Engine
 ↓
Workflow
```

Never:

```text
LLM → payment API
```

Store:
- recommendation,
- confidence,
- reason codes,
- agent version,
- timestamp.

Do not store private chain-of-thought.

## 8. Security

Never commit:
- passwords,
- JWT secrets,
- API keys,
- payment credentials,
- provider secrets.

Never log them.

Protected data access must enforce merchant ownership.

## 9. Errors

Errors should be:
- typed,
- actionable,
- safe,
- traceable.

Do not leak internal stack traces or secrets to clients.

## 10. Tests

Business-critical tests are mandatory.

Minimum categories:
- valid flow,
- invalid state,
- authorization denial,
- tenant isolation,
- idempotency,
- duplicate event,
- timeout,
- UNKNOWN payment,
- policy denial,
- AI invalid output,
- stopping rule.

## 11. Dependencies

Before adding a dependency, answer:
1. What concrete problem does it solve?
2. Can existing dependencies solve it?
3. Is it required now?
4. Does it increase operational complexity?

If the answer is unclear, do not add it.
