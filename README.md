# SLO-Driven Feature Flag Platform

A portfolio-oriented feature flag platform demonstrating distributed systems design, deterministic evaluation logic, and production engineering discipline.

## 90-Second Reviewer TL;DR

If you have under 90 seconds, run this:

```bash
npm run quickstart:smoke
```

It starts the control-plane, performs create/publish/evaluate/rollback checks, validates idempotency replay, and writes a report to `docs/demo/live-e2e-report.md`.

## What this is

This project implements:
- Multi-tenant feature flag control-plane API.
- Deterministic rule + percentage rollout evaluation.
- JavaScript SDK with local cache and refresh loop.
- Admin UI for listing/creating/publishing flags.
- Metrics, load-test scripts, and operations docs.
- Tenant quota controls with usage endpoint (`GET /api/tenants/:tenantId/quotas`).

## Architecture

- `control-plane/`: API, auth/RBAC, idempotency middleware, rate limits, audit log, distribution events.
- `shared/`: common types, validation, and deterministic evaluation engine.
- `sdk/js/`: client cache + refresh and local flag evaluation.
- `ui/`: admin console for flag CRUD/publish actions.
- `loadtest/`: reproducible control-plane and SDK latency scripts.

## Quickstart

### Prerequisites

- Node.js 22+
- Docker (optional, for Postgres/Redis/Prometheus/Grafana)

### Install

```bash
npm run setup
```

### Run services (optional)

```bash
npm run dev-up
```

### Start control-plane

```bash
npm run dev:control-plane
```

### Start UI

```bash
npm run dev:ui
```

### Run tests

```bash
npm run test
```

### Run live demo and incident drill

```bash
npm run demo:e2e-live
npm run drill:incident
npm run drill:redis-stale
```

## API auth

Default tokens:
- `admin-token` -> `admin`
- `operator-token` -> `operator`
- `viewer-token` -> `viewer`

Use `Authorization: Bearer <token>` and `x-tenant-id: <tenant>` for tenant-scoped reads.

## Performance and reliability artifacts

- Control-plane load report: `docs/benchmarks/control-plane-load-report.json`
- SDK evaluation report: `docs/benchmarks/sdk-eval-report.json`
- Incident drill runbook: `docs/runbooks/incident-drill.md`
- SLO dashboard provisioning: `infra/grafana/dashboards/slo.json`

## Trade-offs

- In-memory storage is used for local development speed; SQL migrations are provided for production persistence shape.
- At-least-once publish propagation semantics are preferred over exactly-once complexity for v1.
- Idempotency is request-key based and scoped by token + route for safe retry behavior.
