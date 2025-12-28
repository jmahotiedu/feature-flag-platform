# Architecture

## Overview

```mermaid
flowchart LR
  UI[Admin UI]
  SDK[JS SDK]
  CP[Control Plane API]
  Store[(Flag Store)]
  Audit[(Audit Log)]
  Bus[(Distribution Bus)]
  Metrics[(Prometheus)]

  UI -->|CRUD / publish| CP
  SDK -->|GET /api/sdk/config| CP
  CP --> Store
  CP --> Audit
  CP --> Bus
  CP --> Metrics
```

## Data model

Core entities:
- `environment`
- `segment`
- `flag`
- `flag_version`
- `audit_event`

## Reliability controls

- Request idempotency for mutating endpoints (`Idempotency-Key`).
- Per-tenant and global request throttles.
- Deterministic evaluation with stable hash bucketing.
- Event stream endpoint for publish notifications (`/api/events`).
