# Secrets & Environment Variable Management Guide

This document outlines the secret handling standards and rules for the **AI Revenue Recovery Platform**.

---

## 1. Environment Secrets Policy

- **No Secrets in Source Control**: All sensitive credentials (database passwords, API keys, JWT secrets, LLM provider keys) MUST NEVER be committed to Git.
- **Git Ignore Safeguards**: `.gitignore` strictly ignores `.env`, `.env.local`, `.env.*.local`, `*.pem`, `*.key`, and credential files.
- **Template Baseline**: `.env.example` is committed to repository root as the canonical list of required configuration variables with placeholder values.

---

## 2. Local Development Workflow

1. Clone the repository.
2. Copy the template to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Fill in local secrets (e.g. `LLM_API_KEY`, database credentials) inside `.env`.
4. Verify `.env` is ignored by Git:
   ```bash
   git status # .env should NOT appear in untracked files
   ```

---

## 3. Secret Categorization & Scope

| Variable Category | Examples | Target Storage | Access Level |
| :--- | :--- | :--- | :--- |
| **Database & Cache** | `DATABASE_URL`, `REDIS_URL` | Local `.env` / KMS / Vault | Backend Microservices |
| **AI / LLM Keys** | `LLM_API_KEY` | Environment variable (never logged) | AI Recovery Service |
| **Payment Gateway Credentials** | `RAZORPAY_SECRET`, `STRIPE_KEY` | Vault / AWS Secrets Manager | Gateway Ingestion |
| **Auth Tokens / JWT** | `JWT_SECRET` | Environment variable | API Gateway Auth Module |

---

## 4. Operational Safety Guidelines

1. **Log Redaction**: Standard filters and interceptors automatically redact keys matching `*KEY*`, `*SECRET*`, `*TOKEN*`, `*PASSWORD*` before writing logs.
2. **CI/CD Pipeline Verification**: Automated Git pre-commit hooks and GitHub Actions workflows run secret scanning tools (`gitleaks` / `trufflehog`) to prevent accidental commits.
3. **Rotation**: Production secrets must be rotated every 90 days or immediately upon suspected compromise.
