import cors from "cors";
import express from "express";
import type { AppConfig } from "./config.js";
import { createApiRouter } from "./api/routes.js";
import { createAuthMiddleware } from "./auth/middleware.js";
import { createRateLimiter } from "./limits/rateLimiter.js";
import { createIdempotencyMiddleware } from "./middleware/idempotency.js";
import { metricsSnapshot } from "./metrics/metrics.js";
import { requestMetricsMiddleware } from "./telemetry/requestMetrics.js";
import type { FeatureFlagStore } from "./store/types.js";

export function createApp(deps: {
  config: AppConfig;
  store: FeatureFlagStore;
}) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: deps.config.maxBodyBytes }));
  app.use(requestMetricsMiddleware());

  app.get("/api/health", (_request, response) => {
    response.status(200).json({ ok: true });
  });

  app.get("/api/metrics", async (_request, response) => {
    response.setHeader("Content-Type", "text/plain");
    response.send(await metricsSnapshot());
  });

  app.use(
    createRateLimiter({
      globalRequestsPerMinute: deps.config.globalRequestsPerMinute,
      tenantRequestsPerMinute: deps.config.tenantRequestsPerMinute
    })
  );
  app.use(createAuthMiddleware(deps.config.tokenMap));
  app.use(createIdempotencyMiddleware(deps.config.idempotencyTtlMs));
  app.use(
    "/api",
    createApiRouter({ store: deps.store, tenantFlagQuota: deps.config.tenantFlagQuota })
  );
  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    const message = error instanceof Error ? error.message : "Unknown internal error";
    response.status(500).json({ error: "internal_error", message });
  });

  return app;
}
