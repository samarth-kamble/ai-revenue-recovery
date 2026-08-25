# UI Rules

## Product Tone

The interface should feel:
- operational,
- trustworthy,
- financial,
- clear,
- data-driven.

Avoid:
- toy-like AI visuals,
- excessive animation,
- unexplained AI labels,
- dashboards full of decorative charts.

## State Language

Use exact state semantics.

### Recommendation
AI has proposed an action.

### Authorized
Policy has permitted the action.

### Scheduled
Workflow has scheduled the action.

### Executing
Action is currently being attempted.

### Completed
Action finished successfully.

### Failed
The action failed.

### Unknown
The external result is uncertain and must be reconciled.

### Stopped
The recovery workflow intentionally ended.

Never call an AI recommendation "executed".

## Financial Display

Always show:
- currency,
- amount,
- whether it is at risk or recovered.

Avoid ambiguous labels such as "value" for money.

## AI Display

Show:
- recommendation,
- confidence,
- reason codes,
- model/agent version where useful.

Do not show:
- hidden chain-of-thought,
- internal prompt,
- API secrets.

## Accessibility

- keyboard accessible,
- semantic HTML,
- clear focus,
- readable typography,
- sufficient contrast,
- status cannot depend only on color.

## Error UX

Every important error should answer:
1. What happened?
2. Was money affected?
3. Will the system retry?
4. What happens next?

## Destructive/Financial Actions

Require appropriate confirmation where a human action can affect financial state.

But confirmation does not bypass server-side policy.
