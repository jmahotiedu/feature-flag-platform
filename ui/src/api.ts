export interface UiFlag {
  tenantId: string;
  key: string;
  name: string;
  enabled: boolean;
  version: number;
}

export interface TenantQuotaSummary {
  maxFlags: number;
  usedFlags: number;
  remainingFlags: number;
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const TOKEN = import.meta.env.VITE_API_TOKEN ?? "admin-token";
const TENANT = import.meta.env.VITE_TENANT_ID ?? "tenant-a";

function headers(extra?: Record<string, string>): HeadersInit {
  return {
    Authorization: `Bearer ${TOKEN}`,
    "x-tenant-id": TENANT,
    "Content-Type": "application/json",
    ...(extra ?? {})
  };
}

export async function listFlags(): Promise<UiFlag[]> {
  const response = await fetch(`${BASE_URL}/api/flags`, {
    headers: headers()
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch flags (${response.status})`);
  }
  const payload = (await response.json()) as { flags: UiFlag[] };
  return payload.flags;
}

export async function getTenantQuotas(): Promise<TenantQuotaSummary> {
  const response = await fetch(`${BASE_URL}/api/tenants/${TENANT}/quotas`, {
    headers: headers()
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch tenant quotas (${response.status})`);
  }
  const payload = (await response.json()) as { quotas: TenantQuotaSummary };
  return payload.quotas;
}

export async function createFlag(input: { key: string; name: string }): Promise<UiFlag> {
  const response = await fetch(`${BASE_URL}/api/flags`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      tenantId: TENANT,
      key: input.key,
      name: input.name,
      enabled: true,
      variants: {
        on: true,
        off: false
      },
      fallthroughVariant: "off",
      rules: []
    })
  });
  if (!response.ok) {
    throw new Error(`Failed to create flag (${response.status})`);
  }
  const payload = (await response.json()) as { flag: UiFlag };
  return payload.flag;
}

export async function publishFlag(flagKey: string): Promise<number> {
  const response = await fetch(`${BASE_URL}/api/flags/${flagKey}/publish`, {
    method: "POST",
    headers: headers({ "Idempotency-Key": `publish-${flagKey}` }),
    body: JSON.stringify({ tenantId: TENANT })
  });
  if (!response.ok) {
    throw new Error(`Failed to publish flag (${response.status})`);
  }
  const payload = (await response.json()) as { published: { version: number } };
  return payload.published.version;
}

export async function rollbackFlag(flagKey: string, targetVersion: number): Promise<number> {
  const response = await fetch(`${BASE_URL}/api/flags/${flagKey}/rollback`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ tenantId: TENANT, targetVersion })
  });
  if (!response.ok) {
    throw new Error(`Failed to rollback flag (${response.status})`);
  }
  const payload = (await response.json()) as { rolledBack: { version: number } };
  return payload.rolledBack.version;
}
