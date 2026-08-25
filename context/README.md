# AI Revenue Recovery — Context

This folder is the context package for AI coding agents.

## Purpose

It gives an AI agent enough project knowledge to understand:
- what we are building,
- why we are building it,
- the architecture,
- development order,
- coding standards,
- UI expectations,
- current progress.

## Read First

For a new coding session:

1. `ai-instructions.md`
2. `project-overview.md`
3. `architecture.md`
4. `build-plan.md`
5. `code-standards.md`
6. `progress-tracker.md`
7. repository `PROJECT_SPEC.md`
8. relevant domain/schema files

## Important

This folder is context, not executable application code.

The agent must inspect the actual repository before editing.

## Development Philosophy

Build one verified slice at a time.

```text
Understand
→ Plan
→ Implement
→ Test
→ Verify
→ Record progress
→ Continue
```
