import client, { collectDefaultMetrics, Counter, Gauge, Histogram, Registry } from "prom-client";

const register = new Registry();
collectDefaultMetrics({ register });

export const httpRequestCounter = new Counter({
  name: "ff_http_requests_total",
  help: "Total HTTP requests handled by the control-plane",
  labelNames: ["method", "path", "status"],
  registers: [register]
});

export const httpDurationMs = new Histogram({
  name: "ff_http_request_duration_ms",
  help: "HTTP request duration in milliseconds",
  labelNames: ["method", "path", "status"],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500],
  registers: [register]
});

export const publishCounter = new Counter({
  name: "ff_flag_published_total",
  help: "Total published flag versions",
  labelNames: ["tenant_id", "flag_key"],
  registers: [register]
});

export const publishPropagationDelayMs = new Gauge({
  name: "ff_publish_propagation_delay_ms",
  help: "Simulated publish-to-consume delay in ms",
  labelNames: ["tenant_id", "flag_key"],
  registers: [register]
});

export const sdkConfigCounter = new Counter({
  name: "ff_sdk_config_requests_total",
  help: "Total SDK configuration requests",
  labelNames: ["tenant_id"],
  registers: [register]
});

export async function metricsSnapshot(): Promise<string> {
  return register.metrics();
}

export function resetMetrics(): void {
  register.resetMetrics();
}

export { register, client };
