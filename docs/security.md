# Security Baseline

## Controls implemented

- Token-based auth + role checks.
- Tenant-scoped rate limits.
- Request body limits.
- Idempotent mutation semantics.
- CI security workflow with `npm audit --audit-level=high`.

## Known gaps

- No external identity provider integration yet.
- No encrypted-at-rest key management in local mode.
- In-memory store should be replaced by Postgres repository for production use.
