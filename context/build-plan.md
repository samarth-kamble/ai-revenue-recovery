# Build Plan — AI Revenue Recovery Platform

> This is the implementation roadmap. Do not skip phases because a later feature looks more interesting.

## Development Method

For every task:

```text
Read context
→ implement one task
→ run tests/validation
→ inspect result
→ fix issues
→ mark task verified
→ only then continue
```

Never implement several unrelated phases at once.

---

# Phase 0 — Understand

Before writing code:

- Read PROJECT_SPEC.md
- Read architecture.md
- Read project-overview.md
- Read code-standards.md
- Read the domain model
- Read the current task tracker

Output expected from the AI:
- what the system does,
- what it does not do,
- current phase,
- files it expects to touch.

Do not modify code during this phase.

---

# Phase 1 — Repository Foundation

## Goal

Create a clean, reproducible development environment.

Tasks:
1. initialize Git repository,
2. choose package manager,
3. create workspace structure,
4. configure TypeScript,
5. configure linting,
6. configure formatting,
7. create environment variable strategy,
8. create local development documentation,
9. add basic CI validation.

Verification:
- install works from a clean checkout,
- lint passes,
- typecheck passes,
- tests can run,
- no secrets are committed.

---

# Phase 2 — Domain Model

## Goal

Freeze the business model before database implementation.

Core concepts:

```text
Merchant
Customer
Payment
PaymentAttempt
PaymentFailure
RevenueRisk
RecoveryCase
MLPrediction
AIDecision
Policy
PolicyDecision
RecoveryAction
Notification
AuditEvent
```

Verify:
- relationships,
- cardinalities,
- state transitions,
- ownership,
- tenant boundaries,
- idempotency requirements.

Do not write Prisma migrations until the model is stable.

---

# Phase 3 — Database

## Goal

Create PostgreSQL as the transactional source of truth.

Tasks:
- Prisma schema,
- enums,
- indexes,
- unique constraints,
- foreign keys,
- migrations,
- seed data.

Important rules:
- Decimal for money,
- explicit timestamps,
- unique idempotency keys,
- merchant scoping,
- no deletion of financial history by default.

Verification:
- migration works on clean DB,
- seed works,
- constraints behave correctly,
- duplicate recovery cannot be created accidentally.

---

# Phase 4 — Authentication & Authorization

## Goal

Protect merchant and operational data.

MVP:
- JWT or secure session,
- password hashing if local credentials are used,
- RBAC,
- protected routes,
- merchant isolation.

Roles:

```text
MERCHANT
OPERATIONS
ADMIN
```

Rules:
- authorization is server-side,
- merchant data is tenant-scoped,
- tokens/secrets are never logged,
- UI hiding is not authorization.

---

# Phase 5 — Payment Domain

## Goal

Build the reliable payment model.

Implement:
- create payment,
- payment attempts,
- failure records,
- state transitions,
- idempotency,
- UNKNOWN handling.

Test scenarios:

```text
success
failure
timeout
duplicate request
duplicate webhook
retry
unknown result reconciliation
```

---

# Phase 6 — Revenue Risk

## Goal

Detect revenue that is potentially recoverable.

Implement:
- RevenueRisk creation,
- risk score,
- reason codes,
- RecoveryCase creation,
- case lifecycle.

The risk engine should explain why a payment is considered at risk.

---

# Phase 7 — ML Prediction

## Goal

Estimate recovery probability.

Example:

```text
Payment features
      ↓
ML model
      ↓
recoveryProbability = 0.82
```

The model output is not an authorization.

Track:
- model version,
- prediction timestamp,
- features/version reference where appropriate,
- prediction value.

Evaluate with held-out synthetic data where applicable.

---

# Phase 8 — AI Recovery Agent

## Goal

Convert structured recovery context into a safe recommendation.

Input should include only necessary context:
- payment failure information,
- recovery probability,
- customer/payment context allowed by policy,
- merchant recovery configuration,
- previous recovery actions.

Output schema:

```json
{
  "recommendedAction": "RETRY_PAYMENT",
  "delayMinutes": 30,
  "confidence": 0.86,
  "reasonCodes": [
    "TRANSIENT_FAILURE",
    "HIGH_RECOVERY_PROBABILITY"
  ]
}
```

Rules:
- strict validation,
- no free-form action execution,
- no secrets in prompts,
- no chain-of-thought storage,
- agent version recorded.

---

# Phase 9 — Policy Engine

## Goal

Turn a recommendation into an explicit ALLOW or DENY.

Policy checks may include:
- maximum attempts,
- recovery window,
- allowed action,
- minimum probability,
- merchant configuration,
- quiet hours,
- payment state,
- previous action history.

Example:

```text
AI says:
RETRY_PAYMENT in 30 minutes

Policy:
attempts < 3        ✓
probability >= .70  ✓
action allowed       ✓
payment recoverable  ✓

Result:
ALLOW
```

Policy decision must store the policy version.

---

# Phase 10 — Recovery Workflow

## Goal

Execute approved recovery actions reliably.

Flow:

```text
Policy ALLOW
    ↓
Schedule
    ↓
Execute
    ↓
Payment provider
    ↓
Success / Failure / Unknown
    ↓
Update recovery case
    ↓
Audit
```

Must support:
- retries,
- delays,
- timeout handling,
- idempotency,
- stopping rules,
- terminal outcomes.

---

# Phase 11 — Notifications

Implement controlled notifications such as:
- payment recovery reminder,
- recovery success,
- recovery stopped,
- operator escalation.

Notifications must be idempotent and auditable.

---

# Phase 12 — Audit & Observability

Every important decision should answer:

```text
What happened?
When?
For which merchant?
For which payment?
Who/what caused it?
What did AI recommend?
What did policy decide?
What action executed?
What was the result?
```

Use:
- correlationId,
- traceId,
- event type,
- actor,
- model/agent version,
- policy version.

Never log secrets.

---

# Phase 13 — Dashboard

Build only screens supported by the backend.

Priority:
1. recovery overview,
2. recovery cases,
3. recovery case detail,
4. payment detail,
5. decision timeline,
6. audit timeline.

The dashboard should make the buildathon story obvious.

---

# Phase 14 — Evaluation

Create synthetic data with at least the required volume for the selected buildathon evaluation.

Measure:

### Recovery
- total revenue at risk,
- total recovered,
- recovery rate,
- average attempts,
- unresolved cases.

### ML
- precision,
- recall,
- false-positive cost,
- calibration if useful.

### System
- duplicate prevention,
- policy violations prevented,
- workflow failures recovered,
- audit completeness.

---

# Phase 15 — Reliability

Test:

1. duplicate payment event,
2. duplicate recovery event,
3. gateway timeout,
4. UNKNOWN payment,
5. worker crash,
6. AI invalid output,
7. policy denial,
8. notification failure,
9. payment succeeds after scheduled retry,
10. maximum retry reached.

Every scenario must produce a predictable result.

---

# Phase 16 — Buildathon Delivery

Prepare:
- README,
- architecture diagram,
- setup instructions,
- synthetic demo dataset,
- measurable evaluation,
- failure/recovery demonstration,
- public GitHub repository,
- 5-minute pitch.

The demo must show execution, not only architecture diagrams.
