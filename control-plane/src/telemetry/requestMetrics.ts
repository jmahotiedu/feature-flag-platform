import type { NextFunction, Request, Response } from "express";
import { httpDurationMs, httpRequestCounter } from "../metrics/metrics.js";

function routeLabel(path: string | undefined): string {
  if (!path || path.trim().length === 0) {
    return "unknown";
  }
  return path;
}

export function requestMetricsMiddleware() {
  return (request: Request, response: Response, next: NextFunction): void => {
    const started = performance.now();
    response.on("finish", () => {
      const status = String(response.statusCode);
      const labels = {
        method: request.method,
        path: routeLabel(request.route?.path ?? request.path),
        status
      };
      httpRequestCounter.inc(labels, 1);
      httpDurationMs.observe(labels, performance.now() - started);
    });
    next();
  };
}
