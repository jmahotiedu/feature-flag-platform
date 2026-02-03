# ADR 0001: Distribution Model

## Decision

Use control-plane publish events plus SDK polling refresh in v1.

## Rationale

- Polling is straightforward and robust for early-stage environments.
- Event stream exposure enables near-real-time update paths later.
- Keeps failure handling understandable while preserving deterministic flag evaluation locally.

## Consequences

- Clients may briefly serve stale config between polls.
- UI and runbooks must document acceptable propagation windows.
