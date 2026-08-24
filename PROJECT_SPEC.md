# AI Revenue Recovery Platform

## PROJECT_SPEC.md

**Project:** Autonomous AI Revenue Recovery Platform  
**Target:** Razorpay Buildathon — Track 3: AI Revenue Recovery  
**Document Status:** Canonical source of truth  
**Version:** 1.0

---

# 1. Project Definition

We are building a production-grade prototype of an **AI Revenue Recovery Platform**.

The platform identifies merchant revenue at risk, determines whether that revenue is recoverable, uses ML and AI agents to recommend an appropriate intervention, validates the recommendation against deterministic financial policies, executes a controlled recovery workflow, measures actual revenue recovered, and maintains a complete audit trail.

The platform must demonstrate:

- Revenue at risk identification
- Recovery prediction
- Meaningful AI/agentic decision-making
- Controlled financial actions
- Compliant escalation
- Explicit stopping rules
- Measured money recovered
- Complete auditability
- Reliability and failure recovery
- Reproducible evaluation on synthetic data

## Core principle

> **AI recommends. Policy authorizes. Workflow executes. Payment system acts. Audit records. Analytics measures. ML learns.**

The AI must never directly move money or bypass deterministic financial controls.

---

# 2. Problem Statement

Merchants lose potential revenue because of:

- Failed payments
- Temporary payment failures
- Checkout abandonment
- Subscription payment failures
- Customers not updating payment methods
- Recoverable payment-method or gateway issues

Traditional recovery systems often rely on static retry rules.

Our platform should intelligently answer:

1. What revenue is at risk?
2. Is the revenue likely recoverable?
3. What intervention should be attempted?
4. When should the intervention happen?
5. Is the proposed action permitted by policy?
6. Did the action actually recover revenue?
7. Should the workflow continue, stop, or escalate?

---

# 3. Core Recovery Lifecycle

Every recovery case follows this conceptual lifecycle:

```text
DETECT
  ↓
UNDERSTAND
  ↓
PREDICT
  ↓
DECIDE
  ↓
AUTHORIZE
  ↓
EXECUTE
  ↓
MEASURE
  ↓
LEARN
```

The architecture and features should map naturally to this lifecycle.

---

# 4. Primary Use Case

The first complete vertical slice is **Failed Payment Recovery**.

Example:

```text
Payment fails
    ↓
Create recovery case
    ↓
Calculate revenue at risk
    ↓
Retrieve customer/payment context
    ↓
Predict recovery probability
    ↓
AI recommends intervention
    ↓
Policy engine validates recommendation
    ↓
Temporal workflow schedules action
    ↓
Action is executed
    ↓
Payment status is observed
    ↓
Success → STOP
Failure → Re-evaluate
Unknown → Verify before retrying
Policy violation → STOP / ESCALATE
```

Additional recovery scenarios may be added after the primary workflow is production-quality:

- Checkout drop-off recovery
- Failed subscription recovery
- Mandate retry sequencing
- B2B receivables
- Promise-to-pay tracking

Do not expand to additional scenarios until the core failed-payment workflow is reliable and measurable.

---

# 5. Architecture Principles

## 5.1 AI and financial execution must be separated

Never allow:

```text
LLM → Payment API
```

Use:

```text
LLM
 ↓
Structured Recommendation
 ↓
Policy Engine
 ↓
Approved?
 ↓
Workflow / Action Orchestrator
 ↓
Payment System
```

## 5.2 Deterministic controls override AI recommendations

The LLM can recommend an action, but it cannot override:

- Maximum retry limits
- Retry intervals
- Customer contact limits
- Amount limits
- Business rules
- Stop conditions
- Escalation requirements

## 5.3 Every financial action must be auditable

Every important decision and action must produce an audit event.

## 5.4 Workflows must survive failures

Recovery is a long-running process and must support:

- Delays
- Retries
- Timeouts
- Worker crashes
- External system failures
- Duplicate events
- Unknown payment states
- Safe continuation
- Safe termination

## 5.5 Metrics must come from actual simulation/evaluation

Never fabricate:

- Revenue recovered
- Recovery rate
- Precision
- Recall
- ROI
- AI improvement

All metrics must be reproducible from synthetic data and recorded evaluation runs.

---

# 6. Target Architecture

```text
                         ┌──────────────────────┐
                         │      Next.js Web     │
                         │   Merchant Dashboard │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │      API Gateway     │
                         │ Auth / Rate Limiting │
                         └──────────┬───────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
          ▼                         ▼                         ▼
   Payment Service          Recovery Service             Analytics
          │                         │                         │
          │                         ▼                         │
          │                  AI Decision Layer                │
          │                         │                         │
          │              ┌──────────┼──────────┐              │
          │              ▼          ▼          ▼              │
          │             ML         LLM        Context          │
          │              │          │          │              │
          │              └──────────┼──────────┘              │
          │                         ▼                         │
          │                   Policy Service                  │
          │                         │                         │
          │                         ▼                         │
          │                  Temporal Workflow                │
          │                         │                         │
          │              ┌──────────┼──────────┐              │
          │              ▼          ▼          ▼              │
          │           Retry      Notify    Escalate           │
          │                         │                         │
          └─────────────────────────┼─────────────────────────┘
                                    │
                                    ▼
                           Simulated Payment System


             ┌──────────────────────────────────────────┐
             │              EVENT PLATFORM              │
             │                  Kafka                   │
             └────────────────────┬─────────────────────┘
                                  │
              ┌───────────────────┼────────────────────┐
              ▼                   ▼                    ▼
         PostgreSQL             Redis              Analytics
         Transactions           State              / ClickHouse
              │                   │
              ▼                   ▼
          Audit Data          Workflow State


             ┌──────────────────────────────────────────┐
             │              AI / ML PLATFORM             │
             │                                          │
             │ Synthetic Data → Training → Evaluation   │
             │                  ↓                       │
             │             Model Registry               │
             │                  ↓                       │
             │            ML Inference API              │
             └──────────────────────────────────────────┘
```

---

# 7. Technology Stack

## Frontend

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query

## Monorepo

- Turborepo
- pnpm

## Backend

- NestJS
- TypeScript
- Prisma

## AI / ML

- Python
- FastAPI
- scikit-learn
- XGBoost
- MLflow
- LLM provider with tool calling
- Structured outputs

## Messaging

- Apache Kafka

## Workflow orchestration

- Temporal

## Data

- PostgreSQL
- Redis
- ClickHouse
- S3-compatible object storage / MinIO

## Observability

- OpenTelemetry
- Prometheus
- Grafana
- Loki
- Tempo

## Infrastructure

- Docker
- Docker Compose
- Kubernetes

## Testing

- Jest
- Pytest
- Playwright
- k6

Technology may only be changed when there is a documented architectural reason.

---

# 8. Service Boundaries

## API Gateway

Responsibilities:

- Authentication
- Authorization
- Request validation
- Rate limiting
- Routing
- API aggregation where appropriate

It must not contain core business logic.

## Payment Service

Responsibilities:

- Payments
- Payment attempts
- Payment status
- Gateway webhook handling
- Idempotency
- Payment state transitions

## Revenue Detection Service

Responsibilities:

- Identify failed/recoverable revenue
- Calculate revenue at risk
- Detect relevant revenue-risk events
- Create revenue-risk records

## Recovery Service

Responsibilities:

- Recovery cases
- Recovery state
- Recovery lifecycle
- Recovery history

## AI Decision Service

Responsibilities:

- Gather decision context
- Call ML prediction service
- Invoke AI agent
- Produce structured recommendation
- Never directly execute financial actions

## ML Inference Service

Responsibilities:

- Feature processing
- Recovery probability prediction
- Model versioning
- Prediction metadata

## Policy Service

Responsibilities:

- Deterministic financial rules
- Action authorization
- Retry limits
- Contact limits
- Stop conditions
- Escalation conditions

## Notification Service

Responsibilities:

- Simulated email/SMS/notification delivery
- Templates
- Delivery status
- Rate limits

## Audit Service

Responsibilities:

- Append audit events
- Decision history
- Action history
- Policy decisions
- Workflow history

## Analytics Service

Responsibilities:

- Revenue metrics
- Recovery metrics
- AI performance
- Funnel analytics
- Operational metrics

## Simulation Engine

Responsibilities:

- Synthetic customer generation
- Payment generation
- Failure generation
- Customer behavior simulation
- Recovery outcome simulation
- Ground-truth generation

---

# 9. AI Decision Architecture

The AI decision pipeline is:

```text
Payment + Customer Context
          ↓
Feature Engineering
          ↓
ML Recovery Prediction
          ↓
AI Recovery Agent
          ↓
Structured Recommendation
          ↓
Policy Validation
          ↓
Workflow Execution
```

## ML model

The ML model predicts:

```text
P(recovery)
```

Example:

```json
{
  "recovery_probability": 0.87,
  "model_version": "recovery-v1"
}
```

Potential features:

- Payment amount
- Failure reason
- Previous payment success rate
- Previous recovery success rate
- Number of previous failures
- Number of retries
- Customer lifetime
- Subscription type
- Payment method
- Time since failure
- Customer activity
- Merchant context

The model must be evaluated against ground truth.

## AI agent

The agent selects from a controlled action set:

```text
RETRY_PAYMENT
SEND_REMINDER
REQUEST_PAYMENT_METHOD_UPDATE
ESCALATE
STOP
```

The agent must produce structured output.

Example:

```json
{
  "action": "RETRY_PAYMENT",
  "delay_hours": 12,
  "reason": "High historical recovery probability and temporary failure reason",
  "confidence": 0.91
}
```

The recommendation must be validated before execution.

---

# 10. Policy Engine

Example policies:

```text
MAX_RETRIES = 3
MIN_RETRY_INTERVAL = 12 hours
MAX_CUSTOMER_NOTIFICATIONS = 2
MAX_AUTOMATED_RECOVERY_AMOUNT = configured threshold
STOP_AFTER_SUCCESS = true
STOP_AFTER_MAX_RETRIES = true
ESCALATE_AFTER_REPEATED_FAILURES = true
```

Policy evaluation must be deterministic.

Example:

```text
AI Recommendation
      ↓
Policy Engine
      ↓
┌───────────────┐
│   ALLOWED     │
└───────┬───────┘
        ↓
Workflow
```

or:

```text
┌───────────────┐
│    DENIED     │
└───────┬───────┘
        ↓
STOP / ESCALATE
```

---

# 11. Workflow Architecture

Use Temporal for long-running recovery workflows.

Example:

```text
Payment Failed
      ↓
Create Recovery Case
      ↓
Predict Recovery
      ↓
AI Decision
      ↓
Policy Check
      ↓
Schedule Action
      ↓
Execute
      ↓
Observe Result
      ↓
 ┌────┼──────────────┐
 ▼    ▼              ▼
SUCCESS FAILED      UNKNOWN
 ▼    ▼              ▼
STOP  Re-evaluate   Verify
       │
       ├── Retry
       ├── Notify
       ├── Escalate
       └── Stop
```

Workflows must be idempotent and recoverable.

---

# 12. Event Architecture

Kafka topics should represent meaningful domain events.

Examples:

```text
payment.created
payment.failed
payment.succeeded
revenue-risk.detected
recovery.created
recovery.decision.created
recovery.action.requested
recovery.action.executed
recovery.completed
recovery.escalated
recovery.stopped
```

Do not create topics for every internal function.

Events should represent meaningful domain state changes.

---

# 13. Reliability Requirements

The system must support:

## Idempotency

Duplicate webhook/event must not produce duplicate financial actions.

## Outbox pattern

Important database state changes and events should be made reliably.

## Retries

Transient failures should use controlled retries.

## Exponential backoff

Avoid aggressive retry storms.

## Circuit breakers

Protect services from unhealthy dependencies.

## Dead-letter handling

Events that cannot be processed should be safely isolated.

## Distributed locks

Prevent concurrent recovery actions for the same payment.

## Unknown payment state

A timeout must not automatically be interpreted as payment failure.

Always verify status before performing a potentially duplicate financial action.

---

# 14. Audit Trail

Every important operation should be traceable.

Example:

```text
PAYMENT_FAILED
    ↓
RECOVERY_CASE_CREATED
    ↓
ML_PREDICTION_CREATED
    ↓
AI_DECISION_CREATED
    ↓
POLICY_APPROVED
    ↓
RECOVERY_ACTION_SCHEDULED
    ↓
RECOVERY_ACTION_EXECUTED
    ↓
PAYMENT_SUCCEEDED
    ↓
RECOVERY_COMPLETED
```

Audit records should include:

- Event ID
- Timestamp
- Payment ID
- Recovery case ID
- Actor/service
- Event type
- Decision/action
- Policy result
- Model version where relevant
- Correlation ID
- Trace ID
- Metadata

---

# 15. Synthetic Simulation

The project must work without real money.

Create synthetic data containing:

- Customers
- Merchants
- Payments
- Payment attempts
- Failures
- Subscriptions
- Checkout sessions
- Recovery history

The simulator should produce realistic outcomes.

Most importantly:

> The simulator contains the ground truth, but the AI does not receive the ground-truth label.

This allows honest evaluation.

---

# 16. Evaluation

Evaluation is a first-class feature.

## ML metrics

- Precision
- Recall
- F1
- ROC-AUC
- Calibration

## Business metrics

- Revenue at Risk
- Revenue Recovered
- Recovery Rate
- Recovery Lift
- Recovery ROI
- Intervention Cost
- False Intervention Cost
- Average Recovery Time
- Successful Recovery Count
- Escalation Count
- Stopped Workflow Count

Compare:

```text
Baseline
    vs
Rule-Based Recovery
    vs
AI Recovery
```

All reported metrics must be generated from reproducible evaluation runs.

---

# 17. Dashboard

The dashboard should include:

## Executive Dashboard

- Revenue at risk
- Revenue recovered
- Recovery rate
- Active recovery cases
- Automated actions
- Escalations
- Stopped cases

## Recovery Cases

- Payment
- Customer
- Amount
- Recovery probability
- Current state
- Next action
- Attempts

## AI Decision Monitor

Show structured decision factors, not private chain-of-thought.

Example:

```text
Decision: RETRY

Factors:
✓ High historical recovery rate
✓ Temporary failure
✓ Retry limit not exceeded
✓ Customer recently active

Constraints:
✓ Policy permitted

Confidence: 91%
```

## Audit Trail

Show complete case history.

## Evaluation

Show baseline vs AI performance.

---

# 18. Failure Scenarios

The system must intentionally test failures.

Required scenarios:

1. Duplicate webhook
2. Payment gateway timeout
3. Payment state unknown
4. AI service unavailable
5. ML service unavailable
6. Kafka consumer failure
7. Worker crash
8. Database transient failure
9. Duplicate recovery request
10. Policy rejection

For every failure:

```text
Failure
  ↓
Detection
  ↓
Impact
  ↓
Recovery mechanism
  ↓
Result
  ↓
Audit evidence
```

At least several of these should appear in the final demo.

---

# 19. Repository Structure

Target structure:

```text
ai-revenue-recovery/
│
├── apps/
│   ├── web/
│   ├── gateway/
│   ├── payment-service/
│   ├── recovery-service/
│   ├── policy-service/
│   ├── notification-service/
│   ├── audit-service/
│   └── analytics-service/
│
├── services/
│   ├── ai-agent/
│   ├── ml-inference/
│   └── simulation-engine/
│
├── packages/
│   ├── contracts/
│   ├── database/
│   ├── ai-sdk/
│   ├── logger/
│   ├── config/
│   └── telemetry/
│
├── infrastructure/
│   ├── docker/
│   ├── kafka/
│   ├── postgres/
│   ├── redis/
│   ├── temporal/
│   └── monitoring/
│
├── ml/
│   ├── training/
│   ├── evaluation/
│   ├── experiments/
│   └── models/
│
├── simulator/
│
├── data/
│   ├── synthetic/
│   ├── processed/
│   └── generated/
│
├── docs/
│   ├── architecture/
│   ├── decisions/
│   ├── api/
│   └── evaluation/
│
├── PROJECT_SPEC.md
├── turbo.json
├── pnpm-workspace.yaml
├── docker-compose.yml
└── README.md
```

---

# 20. Development Strategy

Do not implement the entire architecture simultaneously.

## Phase 0 — Architecture

- Repository
- Turborepo
- Service boundaries
- Contracts
- Database schema
- Architecture documentation
- Docker foundation

## Phase 1 — Core Payment System

- Payment service
- Payment state machine
- Webhook simulation
- Idempotency
- PostgreSQL

## Phase 2 — Revenue Detection

- Failure detection
- Revenue-at-risk calculation
- Recovery cases
- Kafka events

## Phase 3 — Recovery Workflow

- Temporal
- Recovery lifecycle
- Actions
- Policy engine
- Stopping rules

## Phase 4 — AI

- Feature engineering
- ML model
- ML inference
- AI recovery agent
- Tool calling
- Structured outputs

## Phase 5 — Simulation

- Synthetic data
- Ground truth
- Failure simulation
- Recovery simulation

## Phase 6 — Evaluation

- ML metrics
- Business metrics
- Baseline comparison
- Evaluation reports

## Phase 7 — Dashboard

- Revenue dashboard
- Recovery cases
- AI decisions
- Audit trail
- Analytics

## Phase 8 — Reliability

- Failure injection
- Observability
- Distributed tracing
- Recovery testing
- Chaos scenarios

## Phase 9 — Final Product

- README
- Architecture diagrams
- Demo scenario
- Deployment
- GitHub cleanup
- 5-minute pitch

---

# 21. Engineering Rules for AI Coding Agents

Claude, Antigravity, and other coding agents must follow these rules.

## Before implementation

Understand:

- Existing architecture
- Domain boundaries
- Data model
- Contracts
- Failure modes
- Security requirements
- Observability requirements

## During implementation

- Make small, verifiable changes
- Keep the repository runnable
- Write tests with important functionality
- Validate generated code
- Avoid unnecessary abstractions
- Preserve domain boundaries
- Use typed contracts
- Add structured logging
- Handle failure paths
- Update documentation when architecture changes

## Never

- Randomly introduce technologies
- Create meaningless microservices
- Allow LLMs to bypass policies
- Fabricate metrics
- Hardcode fake AI decisions
- Create fake production integrations without clearly labeling simulations
- Change architecture silently
- Generate huge untested codebases
- Optimize for technology count instead of business value

---

# 22. Architecture Decision Records

Maintain:

```text
docs/decisions/
```

Examples:

```text
ADR-001-microservices.md
ADR-002-kafka.md
ADR-003-temporal.md
ADR-004-ai-policy-separation.md
ADR-005-postgresql.md
ADR-006-ml-model.md
ADR-007-event-idempotency.md
```

Each ADR contains:

```text
Context
Decision
Alternatives
Reason
Trade-offs
Consequences
```

---

# 23. Definition of Done

A feature is not complete merely because the code compiles.

A meaningful feature should have:

- Implementation
- Unit tests
- Integration tests where needed
- Error handling
- Structured logs
- Metrics where relevant
- Audit events where relevant
- Documentation
- Reproducible local execution

The core recovery workflow is complete only when it can demonstrate:

```text
Detect
  ↓
Predict
  ↓
Decide
  ↓
Authorize
  ↓
Execute
  ↓
Measure
  ↓
Stop / Continue / Escalate
```

---

# 24. Final Product Demonstration

The final 5-minute demo should demonstrate:

## Scenario 1 — Successful Recovery

```text
Failed payment
 → AI identifies high recoverability
 → Policy approves
 → Retry executes
 → Payment succeeds
 → Revenue recovered
 → Workflow stops
```

## Scenario 2 — Safe Stop

```text
Repeated failures
 → Recovery probability decreases
 → Retry limit reached
 → Workflow stops
 → Case escalated
```

## Scenario 3 — Failure Recovery

```text
Payment gateway timeout
 → Payment state becomes UNKNOWN
 → System does NOT blindly retry
 → Status verification
 → Correct state determined
 → Workflow continues safely
```

## Scenario 4 — Measured Impact

Show actual simulation results:

```text
Revenue at Risk
Revenue Recovered
Recovery Rate
Baseline Comparison
AI Improvement
False Interventions
Escalations
Stopped Workflows
```

---

# 25. Product Philosophy

This project is not:

- An AI chatbot
- A generic payment dashboard
- A simple retry script
- An LLM wrapper
- A collection of microservices

It is:

> **A controlled autonomous revenue-recovery system where AI intelligence is combined with deterministic financial policies, durable workflows, event-driven architecture, measurable outcomes, and production-grade reliability.**

The central principle is:

```text
        AI
        ↓
Intelligence
        ↓
Policy
        ↓
Control
        ↓
Workflow
        ↓
Execution
        ↓
Measurement
        ↓
Learning
```

The goal is to demonstrate that AI can create measurable financial value **without sacrificing control, reliability, or auditability**.
