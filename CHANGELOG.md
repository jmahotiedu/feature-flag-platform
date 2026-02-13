# Changelog

## [1.0.0] - 2026-02-12

### Added
- Feature flag control-plane with auth, RBAC, idempotent publish, audit logs, and rollback support.
- Deterministic rule evaluation engine shared between server and JavaScript SDK.
- Admin UI with create/publish/rollback flows.
- SLO dashboard provisioning and metrics instrumentation.
- Live E2E demo runner and incident drill/postmortem scripts.
- Fault-injection integration tests and retry/backoff coverage.
- Tenant flag quota enhancement with quota usage endpoint.

### Changed
- README quickstart now includes a 90-second smoke flow and release validation commands.

### Security
- Security workflow runs `npm audit --audit-level=high` on push and PR.
