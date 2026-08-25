# UI Registry — AI Revenue Recovery Platform

> Every major screen should have a clear purpose and map to backend capabilities.

## 1. Dashboard

### Purpose
Give a merchant an immediate view of recovery performance.

### Data
- revenue at risk,
- recovered revenue,
- active cases,
- recovery rate,
- unresolved cases,
- recent recovery activity.

### User question answered
"How much revenue are we recovering and what needs attention?"

---

## 2. Recovery Cases

### Purpose
Operational list of active/historical recovery cases.

### Columns
- case ID,
- payment,
- amount,
- risk/recovery probability,
- recommendation,
- policy result,
- action status,
- updated time.

### Filters
- status,
- action,
- date,
- policy result.

---

## 3. Recovery Case Detail

### Purpose
Explain one recovery case from failure to outcome.

### Sections

#### Payment
- amount,
- currency,
- payment status,
- customer reference.

#### Failure History
- attempts,
- failure reason,
- gateway status,
- timestamps.

#### ML Prediction
- recovery probability,
- model version,
- timestamp.

#### AI Decision
- recommendation,
- confidence,
- reason codes,
- agent version.

#### Policy
- policy version,
- evaluated rules,
- ALLOW/DENY,
- reason.

#### Recovery Actions
- scheduled,
- executing,
- completed,
- failed,
- stopped.

#### Audit Timeline
Chronological complete flow.

---

## 4. Payment Detail

Show:
- payment status,
- attempt list,
- failures,
- recovery case,
- recovery result.

Important:
`UNKNOWN` must be visually different from `FAILED`.

---

## 5. Audit Timeline

Show:
- timestamp,
- actor,
- event type,
- entity,
- result,
- correlation ID,
- safe metadata.

Do not expose secrets or private AI reasoning.

---

## 6. Operational Rules

UI may display or request actions, but server-side policy decides whether an action is permitted.

Never implement financial authorization only in the frontend.
