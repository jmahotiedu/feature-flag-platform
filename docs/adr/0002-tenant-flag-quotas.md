# ADR 0002: Tenant Flag Quotas

## Status
Accepted

## Context
Operators needed a simple control to prevent runaway tenant growth and quickly inspect quota utilization.

## Decision
Introduce a bounded tenant quota enhancement in v1:
- Enforce `TENANT_FLAG_QUOTA` during `POST /api/flags`.
- Return quota metadata on quota violations.
- Expose `GET /api/tenants/:tenantId/quotas` for operational visibility.

## Consequences
- Prevents unbounded flag creation per tenant in local and CI test environments.
- Keeps scope intentionally narrow to flag-count quotas only.
- Future iterations can extend to publish budgets or cost-aware controls without changing existing API semantics.
