# 2026-02-12 Incident Drill Postmortem

- **Started**: 2026-02-12T02:42:35.112Z
- **Ended**: 2026-02-12T02:42:39.299Z
- **Environment**: local single-node control-plane

## Summary

A controlled control-plane outage was introduced and recovered. After restart, a new publish was applied and evaluation reflected the latest state.

## Timeline

- 2026-02-12T02:42:36.089Z: control-plane started
- 2026-02-12T02:42:36.104Z: seeded and published drill flag (status 201)
- 2026-02-12T02:42:36.327Z: control-plane intentionally stopped
- 2026-02-12T02:42:38.342Z: confirmed outage window (fetch failed)
- 2026-02-12T02:42:39.284Z: control-plane restarted

## Assertions

- Recreate status: 201
- Recovery publish status: 201
- Post-recovery variant: off
- Audit events captured: 2

## Corrective Actions

1. Replace in-memory store with durable Postgres-backed repository so outage drills preserve pre-outage state.
2. Add automated process-restart chaos test in CI for publish/read consistency.
3. Add dashboard screenshots and alert timestamps in follow-up drill with Docker observability stack.
