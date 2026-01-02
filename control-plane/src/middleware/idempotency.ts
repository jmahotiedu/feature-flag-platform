import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../auth/middleware.js";

interface CachedResponse {
  status: number;
  body: unknown;
  expiresAt: number;
}

export function createIdempotencyMiddleware(ttlMs: number) {
  const entries = new Map<string, CachedResponse>();

  return (request: AuthenticatedRequest, response: Response, next: NextFunction): void => {
    const method = request.method.toUpperCase();
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      next();
      return;
    }

    const idempotencyKey = request.header("idempotency-key")?.trim();
    if (!idempotencyKey) {
      next();
      return;
    }

    const now = Date.now();
    const cacheKey = `${request.token ?? "anon"}:${method}:${request.path}:${idempotencyKey}`;
    const cached = entries.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      response.setHeader("Idempotent-Replay", "true");
      response.status(cached.status).json(cached.body);
      return;
    }

    const originalJson = response.json.bind(response);
    response.json = ((body: unknown) => {
      if (response.statusCode < 500) {
        entries.set(cacheKey, {
          status: response.statusCode || 200,
          body,
          expiresAt: Date.now() + ttlMs
        });
      }
      return originalJson(body);
    }) as Response["json"];

    next();
  };
}
