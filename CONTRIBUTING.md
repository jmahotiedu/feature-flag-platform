# Contributing to feature-flag-platform

## Workflow

1. Branch from `main` for each focused change.
2. Keep PR scope tight (single feature/fix or docs set).
3. Add tests for control-plane/shared/sdk/ui behavior changes.
4. Open PR with rationale, risk, and verification commands.

## Local Validation

```bash
npm run lint
npm run test
npm run build
npm run quickstart:smoke
```

## PR Expectations

- Mention tenant/auth/security implications when applicable.
- Link to benchmark or drill artifacts for operational changes.
- Update changelog/docs for externally visible behavior.

## Commit Expectations

- Prefer conventional commit style.
- Keep commits atomic and easy to revert.
- Include enough context for reviewers to reproduce checks.