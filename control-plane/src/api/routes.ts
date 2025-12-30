import { Router } from "express";
import {
  evaluateFlag,
  validateEnvironmentInput,
  validateFlagInput,
  validateSegmentInput,
  type EvaluationContext,
  type FeatureFlag
} from "@ff/shared";
import { requireRole, type AuthenticatedRequest } from "../auth/middleware.js";
import { distributionBus, type DistributionEvent } from "../distribution/eventBus.js";
import { publishCounter, publishPropagationDelayMs, sdkConfigCounter } from "../metrics/metrics.js";
import type { FeatureFlagStore } from "../store/types.js";

function tenantIdFrom(request: AuthenticatedRequest, body: unknown): string | null {
  const tenantFromHeader = request.header("x-tenant-id");
  if (typeof tenantFromHeader === "string" && tenantFromHeader.trim().length > 0) {
    return tenantFromHeader.trim();
  }

  if (typeof body === "object" && body !== null && "tenantId" in body) {
    const tenantId = (body as { tenantId?: unknown }).tenantId;
    if (typeof tenantId === "string" && tenantId.trim().length > 0) {
      return tenantId.trim();
    }
  }

  if (typeof request.query.tenantId === "string" && request.query.tenantId.trim().length > 0) {
    return request.query.tenantId.trim();
  }

  return null;
}

function sanitizeForAudit(payload: unknown): Record<string, unknown> {
  if (typeof payload !== "object" || payload === null) {
    return { value: payload as unknown };
  }
  return payload as Record<string, unknown>;
}

export function createApiRouter(deps: { store: FeatureFlagStore; tenantFlagQuota: number }): Router {
  const router = Router();

  router.post("/environments", requireRole(["admin", "operator"]), (request, response) => {
    const validation = validateEnvironmentInput(request.body);
    if (!validation.valid) {
      response.status(400).json({ error: "invalid environment payload", details: validation.errors });
      return;
    }

    const body = request.body as { tenantId: string; key: string; name: string };
    const environment = deps.store.createEnvironment({
      tenantId: body.tenantId,
      key: body.key,
      name: body.name
    });

    deps.store.appendAudit({
      tenantId: body.tenantId,
      actor: (request as AuthenticatedRequest).token ?? "unknown",
      action: "environment.created",
      resourceType: "environment",
      resourceKey: body.key,
      diff: sanitizeForAudit(body)
    });

    response.status(201).json({ environment });
  });

  router.get("/environments", requireRole(["admin", "operator", "viewer"]), (request, response) => {
    const tenantId = tenantIdFrom(request as AuthenticatedRequest, null);
    if (!tenantId) {
      response.status(400).json({ error: "tenantId is required" });
      return;
    }
    response.status(200).json({ environments: deps.store.listEnvironments(tenantId) });
  });

  router.post("/segments", requireRole(["admin", "operator"]), (request, response) => {
    const validation = validateSegmentInput(request.body);
    if (!validation.valid) {
      response.status(400).json({ error: "invalid segment payload", details: validation.errors });
      return;
    }

    const body = request.body as { tenantId: string; key: string; name: string; conditions: unknown[] };
    const segment = deps.store.createSegment({
      tenantId: body.tenantId,
      key: body.key,
      name: body.name,
      conditions: body.conditions as never
    });

    deps.store.appendAudit({
      tenantId: body.tenantId,
      actor: (request as AuthenticatedRequest).token ?? "unknown",
      action: "segment.created",
      resourceType: "segment",
      resourceKey: body.key,
      diff: sanitizeForAudit(body)
    });

    response.status(201).json({ segment });
  });

  router.get("/segments", requireRole(["admin", "operator", "viewer"]), (request, response) => {
    const tenantId = tenantIdFrom(request as AuthenticatedRequest, null);
    if (!tenantId) {
      response.status(400).json({ error: "tenantId is required" });
      return;
    }
    response.status(200).json({ segments: deps.store.listSegments(tenantId) });
  });

  router.post("/flags", requireRole(["admin", "operator"]), (request, response) => {
    const validation = validateFlagInput(request.body);
    if (!validation.valid) {
      response.status(400).json({ error: "invalid flag payload", details: validation.errors });
      return;
    }

    const body = request.body as Omit<FeatureFlag, "version" | "createdAt" | "updatedAt">;
    const usedFlags = deps.store.listFlags(body.tenantId).length;
    if (usedFlags >= deps.tenantFlagQuota) {
      response.status(429).json({
        error: "tenant flag quota exceeded",
        quota: {
          tenantId: body.tenantId,
          maxFlags: deps.tenantFlagQuota,
          usedFlags
        }
      });
      return;
    }

    try {
      const flag = deps.store.createFlag(body);
      deps.store.appendAudit({
        tenantId: body.tenantId,
        actor: (request as AuthenticatedRequest).token ?? "unknown",
        action: "flag.created",
        resourceType: "flag",
        resourceKey: body.key,
        diff: sanitizeForAudit(body)
      });
      response.status(201).json({ flag });
    } catch (error) {
      response.status(409).json({ error: error instanceof Error ? error.message : "conflict" });
    }
  });

  router.get("/flags", requireRole(["admin", "operator", "viewer"]), (request, response) => {
    const tenantId = tenantIdFrom(request as AuthenticatedRequest, null);
    if (!tenantId) {
      response.status(400).json({ error: "tenantId is required" });
      return;
    }
    response.status(200).json({ flags: deps.store.listFlags(tenantId) });
  });

  router.get(
    "/tenants/:tenantId/quotas",
    requireRole(["admin", "operator", "viewer"]),
    (request, response) => {
      const tenantId = String(request.params.tenantId ?? "").trim();
      if (!tenantId) {
        response.status(400).json({ error: "tenantId is required" });
        return;
      }
      const usedFlags = deps.store.listFlags(tenantId).length;
      response.status(200).json({
        tenantId,
        quotas: {
          maxFlags: deps.tenantFlagQuota,
          usedFlags,
          remainingFlags: Math.max(0, deps.tenantFlagQuota - usedFlags)
        }
      });
    }
  );

  router.get("/flags/:flagKey", requireRole(["admin", "operator", "viewer"]), (request, response) => {
    const tenantId = tenantIdFrom(request as AuthenticatedRequest, null);
    if (!tenantId) {
      response.status(400).json({ error: "tenantId is required" });
      return;
    }
    const flag = deps.store.getFlag(tenantId, String(request.params.flagKey));
    if (!flag) {
      response.status(404).json({ error: "flag not found" });
      return;
    }
    response.status(200).json({ flag });
  });

  router.put("/flags/:flagKey", requireRole(["admin", "operator"]), (request, response) => {
    const validation = validateFlagInput(request.body);
    if (!validation.valid) {
      response.status(400).json({ error: "invalid flag payload", details: validation.errors });
      return;
    }

    const body = request.body as Omit<FeatureFlag, "version" | "createdAt" | "updatedAt">;
    const key = String(request.params.flagKey);
    if (body.key !== key) {
      response.status(400).json({ error: "flag key mismatch between path and body" });
      return;
    }

    const updated = deps.store.updateFlag(body.tenantId, key, body);
    if (!updated) {
      response.status(404).json({ error: "flag not found" });
      return;
    }

    deps.store.appendAudit({
      tenantId: body.tenantId,
      actor: (request as AuthenticatedRequest).token ?? "unknown",
      action: "flag.updated",
      resourceType: "flag",
      resourceKey: body.key,
      diff: sanitizeForAudit(body)
    });

    response.status(200).json({ flag: updated });
  });

  router.post("/flags/:flagKey/publish", requireRole(["admin", "operator"]), (request, response) => {
    const tenantId = tenantIdFrom(request as AuthenticatedRequest, request.body);
    if (!tenantId) {
      response.status(400).json({ error: "tenantId is required" });
      return;
    }
    const flagKey = String(request.params.flagKey);
    const actor = (request as AuthenticatedRequest).token ?? "unknown";
    const published = deps.store.publishFlag(tenantId, flagKey, actor);
    if (!published) {
      response.status(404).json({ error: "flag not found" });
      return;
    }

    const publishedAt = new Date().toISOString();
    distributionBus.emitEvent({
      type: "flag.published",
      tenantId,
      flagKey,
      version: published.version,
      publishedAt
    });

    publishCounter.inc({ tenant_id: tenantId, flag_key: flagKey }, 1);
    publishPropagationDelayMs.set({ tenant_id: tenantId, flag_key: flagKey }, 0);

    deps.store.appendAudit({
      tenantId,
      actor,
      action: "flag.published",
      resourceType: "flag",
      resourceKey: flagKey,
      diff: { version: published.version }
    });

    response.status(201).json({ published });
  });

  router.post("/flags/:flagKey/rollback", requireRole(["admin", "operator"]), (request, response) => {
    const tenantId = tenantIdFrom(request as AuthenticatedRequest, request.body);
    if (!tenantId) {
      response.status(400).json({ error: "tenantId is required" });
      return;
    }

    const body = request.body as { targetVersion?: unknown };
    const targetVersion = Number(body.targetVersion);
    if (!Number.isFinite(targetVersion) || targetVersion < 1) {
      response.status(400).json({ error: "targetVersion must be a positive number" });
      return;
    }

    const flagKey = String(request.params.flagKey);
    const actor = (request as AuthenticatedRequest).token ?? "unknown";
    const rolledBack = deps.store.rollbackFlagToVersion(tenantId, flagKey, targetVersion, actor);
    if (!rolledBack) {
      response.status(404).json({ error: "rollback target not found" });
      return;
    }

    distributionBus.emitEvent({
      type: "flag.published",
      tenantId,
      flagKey,
      version: rolledBack.version,
      publishedAt: new Date().toISOString()
    });

    publishCounter.inc({ tenant_id: tenantId, flag_key: flagKey }, 1);
    publishPropagationDelayMs.set({ tenant_id: tenantId, flag_key: flagKey }, 0);

    deps.store.appendAudit({
      tenantId,
      actor,
      action: "flag.rolled_back",
      resourceType: "flag",
      resourceKey: flagKey,
      diff: { targetVersion, rolledBackVersion: rolledBack.version }
    });

    response.status(200).json({ rolledBack });
  });

  router.get(
    "/flags/:flagKey/history",
    requireRole(["admin", "operator", "viewer"]),
    (request, response) => {
      const tenantId = tenantIdFrom(request as AuthenticatedRequest, null);
      if (!tenantId) {
        response.status(400).json({ error: "tenantId is required" });
        return;
      }

      const history = deps.store.listFlagHistory(tenantId, String(request.params.flagKey));
      response.status(200).json({ history });
    }
  );

  router.post("/evaluate", requireRole(["admin", "operator", "viewer"]), (request, response) => {
    const body = request.body as {
      tenantId?: string;
      flagKey?: string;
      context?: EvaluationContext;
    };

    if (!body.tenantId || !body.flagKey || !body.context) {
      response.status(400).json({ error: "tenantId, flagKey, and context are required" });
      return;
    }

    const flag = deps.store.getFlag(body.tenantId, body.flagKey);
    if (!flag) {
      response.status(404).json({ error: "flag not found" });
      return;
    }

    const result = evaluateFlag(flag, body.context);
    response.status(200).json({ result });
  });

  router.get("/sdk/config", requireRole(["admin", "operator", "viewer"]), (request, response) => {
    const tenantId = tenantIdFrom(request as AuthenticatedRequest, null);
    const environment = typeof request.query.environment === "string" ? request.query.environment : "default";
    if (!tenantId) {
      response.status(400).json({ error: "tenantId is required" });
      return;
    }

    const flags = deps.store.listFlags(tenantId);
    sdkConfigCounter.inc({ tenant_id: tenantId }, 1);

    response.status(200).json({
      tenantId,
      environment,
      generatedAt: new Date().toISOString(),
      flags
    });
  });

  router.get("/audit", requireRole(["admin", "operator", "viewer"]), (request, response) => {
    const tenantId = tenantIdFrom(request as AuthenticatedRequest, null);
    if (!tenantId) {
      response.status(400).json({ error: "tenantId is required" });
      return;
    }
    response.status(200).json({ events: deps.store.listAudit(tenantId) });
  });

  router.get("/events", requireRole(["admin", "operator", "viewer"]), (request, response) => {
    response.setHeader("Content-Type", "text/event-stream");
    response.setHeader("Cache-Control", "no-cache");
    response.setHeader("Connection", "keep-alive");
    response.flushHeaders();

    const listener = (event: DistributionEvent) => {
      response.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    distributionBus.onEvent(listener);
    const ping = setInterval(() => {
      response.write(":keepalive\n\n");
    }, 15_000);

    request.on("close", () => {
      clearInterval(ping);
      distributionBus.offEvent(listener);
      response.end();
    });
  });

  return router;
}
