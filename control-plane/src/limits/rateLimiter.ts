import type { NextFunction, Request, Response } from "express";

type Entry = {
  count: number;
  resetAt: number;
};

export function createRateLimiter(options: {
  globalRequestsPerMinute: number;
  tenantRequestsPerMinute: number;
}) {
  const globalEntry: Entry = { count: 0, resetAt: Date.now() + 60_000 };
  const tenantEntries = new Map<string, Entry>();

  return (request: Request, response: Response, next: NextFunction): void => {
    const now = Date.now();

    if (now >= globalEntry.resetAt) {
      globalEntry.count = 0;
      globalEntry.resetAt = now + 60_000;
    }

    if (globalEntry.count >= options.globalRequestsPerMinute) {
      response.status(429).json({ error: "Global rate limit exceeded." });
      return;
    }

    const tenantId =
      (typeof request.header("x-tenant-id") === "string" && request.header("x-tenant-id")) ||
      "anonymous";
    const tenantEntry = tenantEntries.get(tenantId) ?? {
      count: 0,
      resetAt: now + 60_000
    };

    if (now >= tenantEntry.resetAt) {
      tenantEntry.count = 0;
      tenantEntry.resetAt = now + 60_000;
    }

    if (tenantEntry.count >= options.tenantRequestsPerMinute) {
      response.status(429).json({ error: "Tenant rate limit exceeded." });
      return;
    }

    globalEntry.count += 1;
    tenantEntry.count += 1;
    tenantEntries.set(tenantId, tenantEntry);
    next();
  };
}
