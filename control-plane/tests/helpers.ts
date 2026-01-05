import { createApp } from "../src/app.js";
import type { AppConfig } from "../src/config.js";
import { InMemoryFeatureFlagStore } from "../src/store/memoryStore.js";

export function makeConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    port: 0,
    maxBodyBytes: "1mb",
    globalRequestsPerMinute: 10_000,
    tenantRequestsPerMinute: 10_000,
    tenantFlagQuota: 50,
    idempotencyTtlMs: 60_000,
    tokenMap: new Map([
      ["admin-token", "admin"],
      ["operator-token", "operator"],
      ["viewer-token", "viewer"]
    ]),
    ...overrides
  };
}

export function makeApp(overrides: Partial<AppConfig> = {}) {
  const store = new InMemoryFeatureFlagStore();
  const app = createApp({
    config: makeConfig(overrides),
    store
  });
  return { app, store };
}

export const validFlagPayload = {
  tenantId: "tenant-a",
  key: "new-homepage",
  name: "New Homepage",
  enabled: true,
  variants: {
    on: true,
    off: false
  },
  fallthroughVariant: "off",
  rules: [
    {
      id: "country-us",
      name: "US users",
      conditions: [{ attribute: "country", operator: "eq", value: "US" }],
      variant: "on",
      rolloutPercentage: 100
    }
  ]
};
