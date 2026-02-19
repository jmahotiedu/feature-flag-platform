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

export interface ApiSession {
  token: string;
  tenantId: string;
}

export const DEFAULT_API_TOKEN = import.meta.env.VITE_API_TOKEN ?? "admin-token";
export const DEFAULT_TENANT_ID = import.meta.env.VITE_TENANT_ID ?? "tenant-a";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/+$/, "");

function headers(session: ApiSession, extra?: Record<string, string>): HeadersInit {
  return {
    Authorization: `Bearer ${session.token}`,
    "x-tenant-id": session.tenantId,
    "Content-Type": "application/json",
    ...(extra ?? {})
  };
}

async function request<T>(path: string, session: ApiSession, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...headers(session)
    }
  });
  if (!response.ok) {
    const body = await response.text();
    const suffix = body ? `: ${body}` : "";
    throw new Error(`Request failed (${response.status})${suffix}`);
  }
  return (await response.json()) as T;
}

export async function listFlags(session: ApiSession): Promise<UiFlag[]> {
  const payload = await request<{ flags: UiFlag[] }>("/flags", session);
  return payload.flags;
}

export async function getTenantQuotas(session: ApiSession): Promise<TenantQuotaSummary> {
  const payload = await request<{ quotas: TenantQuotaSummary }>(
    `/tenants/${encodeURIComponent(session.tenantId)}/quotas`,
    session
  );
  return payload.quotas;
}

export async function createFlag(session: ApiSession, input: { key: string; name: string }): Promise<UiFlag> {
  const payload = await request<{ flag: UiFlag }>("/flags", session, {
    method: "POST",
    body: JSON.stringify({
      tenantId: session.tenantId,
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
  return payload.flag;
}

export async function publishFlag(session: ApiSession, flagKey: string): Promise<number> {
  const payload = await request<{ published: { version: number } }>(
    `/flags/${encodeURIComponent(flagKey)}/publish`,
    session,
    {
      method: "POST",
      headers: { "Idempotency-Key": `publish-${flagKey}` },
      body: JSON.stringify({ tenantId: session.tenantId })
    }
  );
  return payload.published.version;
}

export async function rollbackFlag(session: ApiSession, flagKey: string, targetVersion: number): Promise<number> {
  const payload = await request<{ rolledBack: { version: number } }>(
    `/flags/${encodeURIComponent(flagKey)}/rollback`,
    session,
    {
      method: "POST",
      body: JSON.stringify({ tenantId: session.tenantId, targetVersion })
    }
  );
  return payload.rolledBack.version;
}
