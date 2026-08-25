# Domain Model & State Machine Architecture

**Version:** 1.1  
**Status:** Canonical Domain Specification  
**Task:** T007 — Domain Model Review (Updated)

---

## 1. Executive Summary

This document defines the official domain model for the **AI Revenue Recovery Platform**. It outlines all 15 core entities, their attributes, relationships, idempotency rules, and formal state machines for payments, recovery cases, and actions.

The domain architecture strictly enforces the platform's core governance rule:

> **AI recommends. Policy authorizes. Workflow executes. Payment system acts. Audit records. Analytics measures. ML learns.**

---

## 1.1 Changes from v1.0

- **Corrected `PaymentFailure` Cardinality:** Fixed model to `Payment (1) → (N) PaymentAttempt` and `PaymentAttempt (1) → (0..1) PaymentFailure`. Previously incorrectly mapped `Payment 1 → 1 PaymentFailure`.
- **MVP Recovery Case Constraint:** Explicitly constrained `Payment (1) → (1) RecoveryCase` for MVP active recovery tracking. Added notes for future multi-cycle extensions.
- **Clarified `Customer.riskScore`:** Explicitly documented that `riskScore` tracks historical customer reliability and MUST NOT be confused with ML recovery probability $P(\text{recovery})$ or fraud risk.
- **Strengthened `RecoveryDecision` Schema:** Added explicit fields (`decisionId`, `agentVersion`, `reasonCodes`, `recommendedDelayMinutes`). Banned storing private chain-of-thought.
- **Structured AI Recommendation Boundary:** Defined standardized AI payload (`recommendedAction`, `delayMinutes`, `confidence`, `reasonCodes`) and re-enforced execution guardrails.
- **Policy Versioning & Auditability:** Enhanced `Policy` with `version`, `status`, and `effectiveFrom`. Updated `PolicyDecision` to record `policyVersion` for immutable financial audit trails.
- **Updated ERD & State Alignment:** Re-aligned ERD cardinalities and cross-entity state consistency.

---

## 2. Core Entities & Field Specifications

### 2.1 Core Business Entities

#### `Merchant`

Represents the business user operating on the platform (e.g., SaaS or e-commerce merchant using Razorpay).

- `id` (UUID, Primary Key)
- `name` (String, Required)
- `email` (String, Unique, Required)
- `apiKeyHash` (String, Required)
- `config` (JSONB, Required): Merchant default limits (`maxRetries`, `minRetryIntervalHours`, `maxAutoAmount`, `contactLimits`)
- `createdAt` (Timestamp, Required)
- `updatedAt` (Timestamp, Required)

#### `Customer`

Represents the end-user purchasing from the Merchant.

- `id` (UUID, Primary Key)
- `merchantId` (UUID, Foreign Key → `Merchant.id`)
- `externalCustomerId` (String, Required): Merchant's internal customer identifier
- `email` (String, Optional)
- `phone` (String, Optional)
- `name` (String, Optional)
- `riskScore` (Float 0.0–1.0, Optional): Historical customer reliability/payment behavior score. **Note:** This represents overall historical customer reliability only. It MUST NOT be treated as ML recovery probability ($P(\text{recovery})$), ML recovery prediction, or fraud risk.
- `metadata` (JSONB): Custom key-value tags
- `createdAt` (Timestamp, Required)
- `updatedAt` (Timestamp, Required)

#### `Payment`

Represents the top-level financial transaction intent.

- `id` (UUID, Primary Key)
- `merchantId` (UUID, Foreign Key → `Merchant.id`)
- `customerId` (UUID, Foreign Key → `Customer.id`)
- `amount` (Decimal/Int in smallest currency unit, Required)
- `currency` (String 3-letter ISO code, default `"INR"`)
- `status` (`PaymentStatus` Enum, Required): `PENDING` | `AUTHORIZED` | `FAILED` | `RECOVERING` | `SUCCEEDED` | `FAILED_PERMANENT` | `ABANDONED`
- `description` (String, Optional)
- `metadata` (JSONB)
- `createdAt` (Timestamp, Required)
- `updatedAt` (Timestamp, Required)

---

### 2.2 Payment Execution & Failure Tracking

#### `PaymentAttempt`

Tracks individual gateway execution attempts for a payment. A single payment can have multiple attempts over time.

- `id` (UUID, Primary Key)
- `paymentId` (UUID, Foreign Key → `Payment.id`)
- `attemptNumber` (Integer, Required)
- `idempotencyKey` (String, Unique, Required): Guaranteed single-execution token
- `gateway` (String, Required, e.g., `"RAZORPAY"`)
- `gatewayTransactionId` (String, Optional)
- `status` (`AttemptStatus` Enum, Required): `INITIATED` | `PROCESSING` | `SUCCESS` | `FAILED` | `UNKNOWN`
- `errorCode` (String, Optional)
- `errorMessage` (String, Optional)
- `rawResponse` (JSONB, Optional)
- `createdAt` (Timestamp, Required)

#### `PaymentFailure`

Structured failure details captured when a `PaymentAttempt` fails. Each failed `PaymentAttempt` produces exactly 0 or 1 failure record.

- `id` (UUID, Primary Key)
- `paymentId` (UUID, Foreign Key → `Payment.id`)
- `paymentAttemptId` (UUID, Unique, Foreign Key → `PaymentAttempt.id`)
- `failureCode` (`FailureCode` Enum, Required): `INSUFFICIENT_FUNDS` | `EXPIRED_CARD` | `BANK_DOWNTIME` | `AUTHENTICATION_FAILED` | `GATEWAY_TIMEOUT` | `INVALID_CARD` | `MANDATE_EXPIRED`
- `failureReason` (String, Required)
- `isTransient` (Boolean, Required): Dictates immediate retry eligibility
- `rawDetails` (JSONB)
- `createdAt` (Timestamp, Required)

---

### 2.3 Recovery Risk & Case Lifecycle

#### `RevenueRisk`

Calculated assessment of revenue at risk and recoverability.

- `id` (UUID, Primary Key)
- `paymentId` (UUID, Foreign Key → `Payment.id`)
- `merchantId` (UUID, Foreign Key → `Merchant.id`)
- `amountAtRisk` (Decimal/Int, Required)
- `currency` (String, Required)
- `recoverabilityScore` (Float 0.0–1.0, Required)
- `riskLevel` (`RiskLevel` Enum, Required): `LOW` | `MEDIUM` | `HIGH` | `CRITICAL`
- `calculatedAt` (Timestamp, Required)

#### `RecoveryCase`

The central aggregate boundary managing the automated recovery lifecycle. For the MVP, each Payment maps to exactly 1 active `RecoveryCase`. _(Note: Multi-cycle historical case extensions are supported in future phases by adding a `cycleNumber` field)._

- `id` (UUID, Primary Key)
- `paymentId` (UUID, Unique, Foreign Key → `Payment.id`)
- `merchantId` (UUID, Foreign Key → `Merchant.id`)
- `customerId` (UUID, Foreign Key → `Customer.id`)
- `caseNumber` (String, Unique, Required): Human-readable reference (e.g., `REC-2026-00042`)
- `status` (`CaseStatus` Enum, Required): `CREATED` | `ANALYZING` | `ACTION_SCHEDULED` | `ACTION_EXECUTING` | `RECOVERED` | `STOPPED` | `ESCALATED`
- `currentAttemptCount` (Integer, Default 0)
- `maxAttemptLimit` (Integer, Required)
- `stopReason` (String, Optional)
- `escalationReason` (String, Optional)
- `createdAt` (Timestamp, Required)
- `updatedAt` (Timestamp, Required)
- `closedAt` (Timestamp, Optional)

---

### 2.4 AI & ML Intelligence

#### `MLPrediction`

Statistical inference output produced by the ML Inference Service.

- `id` (UUID, Primary Key)
- `recoveryCaseId` (UUID, Foreign Key → `RecoveryCase.id`)
- `modelVersion` (String, Required, e.g., `"xgb-recovery-v1.2"`)
- `recoveryProbability` (Float 0.0–1.0, Required): Statistical likelihood $P(\text{recovery})$
- `featureSnapshot` (JSONB, Required): Point-in-time features evaluated
- `predictionMetadata` (JSONB)
- `predictedAt` (Timestamp, Required)

#### `RecoveryDecision`

Structured strategy recommendation from the AI Agent. Private chain-of-thought reasoning MUST NOT be stored.

- `decisionId` (UUID, Primary Key)
- `recoveryCaseId` (UUID, Foreign Key → `RecoveryCase.id`)
- `mlPredictionId` (UUID, Foreign Key → `MLPrediction.id`)
- `agentVersion` (String, Required, e.g., `"recovery-agent-v1.0"`)
- `recommendedAction` (`ActionType` Enum, Required): `RETRY_PAYMENT` | `SEND_REMINDER` | `REQUEST_PAYMENT_METHOD_UPDATE` | `ESCALATE` | `STOP`
- `recommendedDelayMinutes` (Integer, Required): Delay duration in minutes
- `confidence` (Float 0.0–1.0, Required)
- `reasonCodes` (Array of Strings / JSONB, Required): Structured factor codes (e.g., `["HIGH_PAST_RECOVERY", "BANK_DOWNTIME_RESOLVED"]`)
- `createdAt` (Timestamp, Required)

##### AI Recommendation Output Payload Schema

The AI Agent must return a structured JSON output matching this strict schema:

```json
{
  "recommendedAction": "RETRY_PAYMENT",
  "delayMinutes": 720,
  "confidence": 0.89,
  "reasonCodes": ["HIGH_HISTORICAL_RECOVERY", "TRANSIENT_FAILURE_CODE"]
}
```

_Governance Rule:_ The AI recommendation MUST NOT execute payment operations directly.

---

### 2.5 Policy, Guardrails & Execution

#### `Policy`

Merchant-configured deterministic financial ruleset supporting versioning for auditability.

- `id` (UUID, Primary Key)
- `merchantId` (UUID, Foreign Key → `Merchant.id`)
- `policyName` (String, Required)
- `version` (Integer / String, Required, e.g., `1` or `"v1.2"`): Incremental version number
- `rules` (JSONB, Required): Defines `max_retries`, `min_interval_minutes`, `max_amount`, `prohibited_hours`
- `status` (`PolicyStatus` Enum, Required): `ACTIVE` | `ARCHIVED`
- `effectiveFrom` (Timestamp, Required)
- `createdAt` (Timestamp, Required)
- `updatedAt` (Timestamp, Required)

#### `PolicyDecision`

Outcome of evaluating an AI recommendation against a specific policy version.

- `id` (UUID, Primary Key)
- `recoveryDecisionId` (UUID, Foreign Key → `RecoveryDecision.decisionId`)
- `policyId` (UUID, Foreign Key → `Policy.id`)
- `policyVersion` (Integer / String, Required): Records the exact version of the policy evaluated for auditability
- `status` (`AuthorizationStatus` Enum, Required): `APPROVED` | `DENIED`
- `rejectionReason` (String, Optional)
- `evaluatedRules` (JSONB, Required)
- `evaluatedAt` (Timestamp, Required)

#### `RecoveryAction`

Durable action orchestrated by Temporal.

- `id` (UUID, Primary Key)
- `recoveryCaseId` (UUID, Foreign Key → `RecoveryCase.id`)
- `policyDecisionId` (UUID, Foreign Key → `PolicyDecision.id`)
- `actionType` (`ActionType` Enum, Required)
- `status` (`ActionStatus` Enum, Required): `SCHEDULED` | `EXECUTING` | `COMPLETED` | `FAILED` | `CANCELLED`
- `scheduledAt` (Timestamp, Required)
- `executedAt` (Timestamp, Optional)
- `idempotencyKey` (String, Unique, Required)
- `attemptNumber` (Integer, Required)
- `executionResult` (JSONB, Optional)

#### `Notification`

Record of customer communication sent during recovery.

- `id` (UUID, Primary Key)
- `recoveryActionId` (UUID, Foreign Key → `RecoveryAction.id`)
- `customerId` (UUID, Foreign Key → `Customer.id`)
- `channel` (`Channel` Enum, Required): `EMAIL` | `SMS` | `WHATSAPP` | `PUSH`
- `templateId` (String, Required)
- `recipient` (String, Required)
- `status` (`DeliveryStatus` Enum, Required): `QUEUED` | `SENT` | `DELIVERED` | `FAILED`
- `sentAt` (Timestamp, Optional)

---

### 2.6 Compliance & Audit

#### `AuditEvent`

Immutable append-only record of every critical system operation.

- `id` (UUID, Primary Key)
- `eventId` (String, Unique, Required)
- `timestamp` (Timestamp, Required)
- `merchantId` (UUID, Required)
- `paymentId` (UUID, Required)
- `recoveryCaseId` (UUID, Optional)
- `actor` (String, Required): e.g., `"service:recovery-service"`, `"user:admin"`
- `eventType` (String, Required): e.g., `"PAYMENT_FAILED"`, `"AI_DECISION_CREATED"`, `"POLICY_APPROVED"`
- `payload` (JSONB, Required)
- `policyResult` (String, Optional)
- `modelVersion` (String, Optional)
- `correlationId` (UUID, Required)
- `traceId` (String, Required)

---

## 3. Entity Relationship Diagram (ERD) & Cardinalities

```text
Merchant (1) ────< Customer (N)
   │
   ├─────────────< Policy (N)
   │
   └─────────────< Payment (1) ───(MVP 1:1)─── RecoveryCase (1)
                      │                            │
                      ├─< PaymentAttempt (N)       ├───< MLPrediction (N)
                      │       │                    │
                      │   (1:0..1)                 ├───< RecoveryDecision (N)
                      │       ▼                    │            │
                      │  PaymentFailure            │         (1:1)
                      │                            │            ▼
                      └── RevenueRisk (1)          │      PolicyDecision
                                                   │            │
                                                   └───< RecoveryAction (N) ───< Notification (N)
```

---

## 4. Formal State Machines

### 4.1 Payment Status State Machine

```text
               ┌──────────┐
               │ PENDING  │
               └────┬─────┘
                    │
            ┌───────┴───────┐
            ▼               ▼
      ┌───────────┐   ┌───────────┐
      │AUTHORIZED │   │  FAILED   │
      └─────┬─────┘   └─────┬─────┘
            │               │
            ▼               ▼
      ┌───────────┐   ┌───────────┐
      │ SUCCEEDED │   │RECOVERING │
      └───────────┘   └─────┬─────┘
                            │
               ┌────────────┴────────────┐
               ▼                         ▼
         ┌───────────┐          ┌──────────────────┐
         │ SUCCEEDED │          │ FAILED_PERMANENT │
         │(Recovered)│          │    / ABANDONED   │
         └───────────┘          └──────────────────┘
```

**State Transition Guard Rules:**

- `PENDING` → `AUTHORIZED` | `FAILED`
- `FAILED` → `RECOVERING` (Only when `RecoveryCase` is initialized)
- `RECOVERING` → `SUCCEEDED` (When recovery retry completes successfully)
- `RECOVERING` → `FAILED_PERMANENT` (When stopping rules trigger without recovery)
- **Terminal States:** `SUCCEEDED`, `FAILED_PERMANENT`, `ABANDONED` (No outward transitions allowed).

---

### 4.2 RecoveryCase Lifecycle State Machine

```text
               ┌──────────┐
               │ CREATED  │
               └────┬─────┘
                    │
                    ▼
               ┌──────────┐
               │ANALYZING │ (ML + AI Agent)
               └────┬─────┘
                    │
            ┌───────┴───────┐
            ▼               ▼
  ┌──────────────────┐  ┌──────────┐
  │ ACTION_SCHEDULED │  │ STOPPED  │ (Policy Denied / Low Score)
  └─────────┬────────┘  └──────────┘
            │
            ▼
  ┌──────────────────┐
  │ ACTION_EXECUTING │
  └─────────┬────────┘
            │
      ┌─────┼──────────────┐
      ▼     ▼              ▼
┌───────────┐ ┌──────────┐ ┌──────────┐
│ RECOVERED │ │ ANALYZING│ │ESCALATED │
│ (Success) │ │ (Retry)  │ │ (Policy) │
└───────────┘ └──────────┘ └──────────┘
```

---

### 4.3 RecoveryAction State Machine

```text
             ┌───────────┐
             │ SCHEDULED │
             └─────┬─────┘
                   │
                   ▼
             ┌───────────┐
             │ EXECUTING │
             └─────┬─────┘
        ┌──────────┴──────────┐
        ▼                     ▼
  ┌───────────┐         ┌───────────┐
  │ COMPLETED │         │  FAILED   │
  └───────────┘         └───────────┘
```

**Terminal Action Rules:**

- Actions in `SCHEDULED` state can be set to `CANCELLED` if a payment succeeds externally before timer expiry.
- Actions in `EXECUTING` state must log an `idempotencyKey` check before executing financial charges.

---

## 5. Idempotency & Compliance Rules

1. **Payment Retries:** Every `RecoveryAction` of type `RETRY_PAYMENT` MUST generate an `idempotencyKey` derived deterministically from:  
   `hash(recoveryCaseId + attemptNumber + scheduledAt)`.
2. **Duplicate Webhook Isolation:** If `payment.failed` event is delivered multiple times via Kafka, `RecoveryCase` creation enforces a `UNIQUE(paymentId)` constraint in PostgreSQL to ensure only one case is opened for MVP.
3. **Audit Trail Immutability:** `AuditEvent` table has no `UPDATE` or `DELETE` triggers or permissions; it is strictly append-only.
4. **Unknown Payment Handling:** If a gateway timeout occurs, `PaymentAttempt` status is set to `UNKNOWN`. No new financial retry action may execute until a status check query confirms the payment was not charged.
