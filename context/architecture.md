# Architecture Context — AI Revenue Recovery Platform

> This document is the architectural source of truth for understanding the system.
> Read this before designing or implementing a feature.

## 1. Product

**Name:** AI Revenue Recovery Platform  
**Buildathon Track:** AI Revenue Recovery

The platform helps merchants recover revenue lost because of payment failures.

The system does not blindly retry payments. It:

1. detects a payment failure,
2. determines whether revenue is recoverable,
3. predicts recovery likelihood,
4. asks an AI agent to recommend an intervention,
5. validates the recommendation,
6. applies deterministic merchant policy,
7. executes an approved recovery workflow,
8. stops when recovery should no longer continue,
9. records the complete decision and execution history,
10. measures the financial result.

## 2. Most Important Architectural Rule

The AI is a **decision-support component**, not an unrestricted financial executor.

Correct:

```text
Payment Failure
      ↓
Revenue Risk
      ↓
ML Prediction
      ↓
AI Recommendation
      ↓
Structured Output Validation
      ↓
Policy Engine
      ↓
ALLOW / DENY
      ↓
Durable Recovery Workflow
      ↓
Recovery Action
      ↓
Payment Service
```

Incorrect:

```text
Payment Failure
      ↓
LLM
      ↓
"Retry payment"
      ↓
Direct payment API call
```

The LLM must never receive authority merely because it produced a recommendation.

## 3. Logical Components

### Web Application
Merchant and operations dashboard.

Responsibilities:
- display recovery metrics,
- display recovery cases,
- display payment history,
- display AI recommendations,
- display policy decisions,
- display audit timeline,
- initiate authorized operational actions.

The web application is never the source of truth for authorization.

### API / Backend
System entry point for application requests.

Responsibilities:
- authentication,
- authorization,
- validation,
- orchestration of use cases,
- domain API,
- tenant isolation.

### Payment Domain
Represents:
- Payment,
- PaymentAttempt,
- PaymentFailure.

Important distinction:

```text
Payment = business-level payment
PaymentAttempt = one gateway execution attempt
PaymentFailure = failure information for an attempt
```

One payment may have many attempts.

### Revenue Risk Engine
Determines whether a payment represents recoverable revenue risk.

It creates or updates a RecoveryCase.

### ML Prediction Component
Produces deterministic model output such as:

```text
recoveryProbability = 0.82
```

It does not authorize financial actions.

### AI Recovery Agent
Consumes structured payment/risk context and proposes an action.

Example:

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

The output must be schema-validated.

Do not store or expose private chain-of-thought.

### Policy Engine
Deterministically evaluates whether the proposed action is allowed.

Example rules:

```text
maxRetries = 3
minimumRecoveryProbability = 0.70
allowedActions = [RETRY_PAYMENT, SEND_REMINDER]
quietHours = enabled
```

Policy evaluation must be deterministic and auditable.

### Recovery Workflow
Executes only approved actions.

Responsibilities:
- schedule action,
- wait,
- retry,
- handle timeout,
- handle gateway failure,
- enforce stopping rules,
- record outcome.

### Audit Service
Records important events as an append-only history.

Examples:
- payment failed,
- risk detected,
- prediction generated,
- AI recommendation created,
- policy approved,
- policy denied,
- action scheduled,
- action executed,
- payment recovered,
- recovery stopped.

## 4. State and Reliability Principles

### Payment UNKNOWN

A gateway timeout does not necessarily mean a payment failed.

Therefore:

```text
gateway timeout → UNKNOWN
```

must not automatically become:

```text
gateway timeout → FAILED
```

The system must reconcile an unknown payment before performing a potentially duplicate financial action.

### Idempotency

Every financial operation must have an idempotency strategy.

Duplicate events must not create duplicate charges or duplicate recovery actions.

### Stopping Rules

Recovery must have explicit limits.

Examples:
- maximum attempts,
- maximum recovery window,
- minimum recovery probability,
- merchant policy restrictions,
- terminal payment state,
- repeated failures,
- compliance/quiet-hour constraints.

### Tenant Isolation

Every merchant-owned record must be scoped by `merchantId`.

A request authenticated for Merchant A must never access Merchant B data.

## 5. Recommended System Boundaries

Keep these boundaries clear:

```text
UI
 ↓
API
 ↓
Application Use Case
 ↓
Domain / Policy
 ↓
Workflow
 ↓
Infrastructure / Payment Provider
```

AI should sit inside the application decision flow, not around the entire system.

## 6. Infrastructure Guidance

Use infrastructure only where it solves a demonstrated problem.

Potential components:

- PostgreSQL — source of truth for transactional domain data
- Redis — only if caching/short-lived coordination is required
- Kafka — only if event streaming is actually required
- Temporal — only when durable long-running recovery workflows justify it
- Object storage — only for required artifacts
- ML service — separate process/service only when model execution requires it

Do not introduce microservices, Kafka, Temporal, Redis, or other infrastructure merely because they sound production-grade.

## 7. Request/Decision Trace

A recovery case should be traceable end-to-end:

```text
correlationId
    ↓
Payment
    ↓
PaymentAttempt
    ↓
RevenueRisk
    ↓
RecoveryCase
    ↓
MLPrediction
    ↓
AIDecision
    ↓
PolicyDecision
    ↓
RecoveryAction
    ↓
PaymentAttempt
    ↓
AuditEvent
```

The same recovery decision must be explainable after the fact.

## 8. Security Boundary

Authentication and authorization are separate from financial policy.

```text
Authentication
    ↓
Who are you?
    ↓
Authorization
    ↓
What are you allowed to access?
    ↓
Policy Engine
    ↓
Is this financial action allowed?
```

An authenticated admin does not bypass deterministic financial policy automatically.

## 9. Architecture Anti-Patterns

Do not implement:

- LLM directly calling a charge API.
- Frontend deciding whether a recovery action is allowed.
- Duplicate retry logic in multiple services.
- Unbounded payment retries.
- Treating every timeout as failure.
- Using a single generic "risk score" for fraud, recovery, and customer reliability.
- Logging credentials or tokens.
- Storing chain-of-thought.
- Adding infrastructure without a concrete requirement.
