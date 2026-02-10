# Week 8 Enhancement: Tenant Quotas

## What was added

- Per-tenant flag creation quota via `TENANT_FLAG_QUOTA` (default `50`).
- Quota enforcement in `POST /api/flags` with clear 429 responses.
- Operator visibility endpoint: `GET /api/tenants/:tenantId/quotas`.

## Why this helps operators

- Prevents accidental unbounded tenant growth.
- Gives immediate usage/remaining capacity visibility for triage.

## Scope boundaries

- Only flag-count quotas are in scope for v1.
- Publish budgets, spend tracking, and billing integration are explicitly out of scope.
