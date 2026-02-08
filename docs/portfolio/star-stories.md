# Portfolio Story Pack

## STAR 1: Latency and SLOs
- Situation: Feature config reads needed consistent low latency.
- Task: Add measurable SLO-style observability.
- Action: Added request histograms/counters and dashboard quantiles.
- Result: Produced p50/p95/p99 reports and alertable metrics baseline.

## STAR 2: Safe retry semantics
- Situation: Publish endpoint could receive duplicate retries.
- Task: Prevent duplicate side effects while keeping API retry-safe.
- Action: Implemented idempotency middleware keyed by token + route + idempotency key.
- Result: Replayed responses with explicit header and stable version outcome.

## STAR 3: Deterministic rollouts
- Situation: Evaluation drift between services and SDK causes bad rollouts.
- Task: Guarantee deterministic percentage assignment.
- Action: Shared stable hashing and evaluation logic across control-plane and SDK tests.
- Result: Deterministic parity fixtures and property tests for repeated contexts.
