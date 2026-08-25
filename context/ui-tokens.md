# UI Tokens

> These are semantic design tokens, not a final visual design.

## Typography

Define tokens for:
- display,
- page heading,
- section heading,
- body,
- secondary text,
- labels,
- table text,
- technical/code text.

## Spacing

Base scale:

```text
4
8
12
16
24
32
48
64
```

Components should use the scale instead of arbitrary spacing.

## Radius

```text
small
medium
large
pill
```

## Elevation

Use a small number of levels:
- none,
- low,
- medium,
- high.

## Semantic Status

```text
success
warning
error
info
neutral
```

## Financial Semantics

```text
revenueRecovered
revenueAtRisk
paymentSuccess
paymentFailure
paymentUnknown
unresolvedException
```

## Recovery Semantics

```text
recommended
authorized
scheduled
executing
completed
failed
stopped
```

## Token Rule

Components must reference semantic tokens rather than hard-coding visual values.

This allows the design system to evolve without rewriting business components.
