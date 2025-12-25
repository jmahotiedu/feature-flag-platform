import type { Role } from "@ff/shared";

function parseTokenMap(raw: string): Map<string, Role> {
  const tokenMap = new Map<string, Role>();
  const entries = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  for (const entry of entries) {
    const [token, role] = entry.split(":").map((part) => part.trim());
    if (!token || !role) {
      continue;
    }
    if (role === "admin" || role === "operator" || role === "viewer") {
      tokenMap.set(token, role);
    }
  }
  return tokenMap;
}

export interface AppConfig {
  port: number;
  maxBodyBytes: string;
  globalRequestsPerMinute: number;
  tenantRequestsPerMinute: number;
  tenantFlagQuota: number;
  idempotencyTtlMs: number;
  tokenMap: Map<string, Role>;
}

export function loadConfig(): AppConfig {
  const tokenMap = parseTokenMap(
    process.env.FF_TOKENS ??
      "admin-token:admin,operator-token:operator,viewer-token:viewer"
  );

  return {
    port: Number(process.env.PORT ?? 8080),
    maxBodyBytes: process.env.MAX_BODY_BYTES ?? "1mb",
    globalRequestsPerMinute: Number(process.env.GLOBAL_RPM ?? 1200),
    tenantRequestsPerMinute: Number(process.env.TENANT_RPM ?? 300),
    tenantFlagQuota: Number(process.env.TENANT_FLAG_QUOTA ?? 50),
    idempotencyTtlMs: Number(process.env.IDEMPOTENCY_TTL_MS ?? 300_000),
    tokenMap
  };
}
