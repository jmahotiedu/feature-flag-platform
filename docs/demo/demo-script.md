# Demo Script

## Automated command

```bash
npm run demo:e2e-live
```

This command executes the full demo flow and writes evidence to:
- `docs/demo/live-e2e-report.md`

## Covered flow

1. Start control-plane and wait for `/api/health`.
2. Create `new-homepage` flag.
3. Publish with idempotency key and verify replay behavior.
4. Evaluate US and non-US contexts.
5. Measure rollout percentage behavior for a sampled tenant.
6. Roll back to a prior version and verify audit log entry.
7. Capture metrics output excerpt.
