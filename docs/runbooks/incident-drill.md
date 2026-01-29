# Incident Drill Runbook

## Scenario

Control-plane interruption during active publish traffic.

## Automated command

```bash
npm run drill:incident
npm run drill:redis-stale
```

This command executes the drill and writes:
- `docs/postmortems/2026-02-12-incident-drill.md`
- `docs/postmortems/2026-02-12-redis-outage-stale-state-check.md`

## Steps

1. Start control-plane and seed at least one flag.
2. Publish baseline state.
3. Stop control-plane for a short outage window.
4. Confirm request failure during outage.
5. Restart control-plane and publish recovery state.
6. Validate:
   - Recovery publish is successful.
   - Post-recovery evaluation reflects latest publish state.
   - Audit trail captures restart-window actions.

## Evidence to capture

- Timeline with UTC timestamps.
- SLO dashboard screenshots for latency/error impact.
- Corrective actions and follow-ups.
