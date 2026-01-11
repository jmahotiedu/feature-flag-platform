import { describe, expect, it, vi } from "vitest";
import type { FeatureFlag } from "@ff/shared";
import { FeatureFlagClient } from "../src/client.js";

const snapshot = {
  tenantId: "tenant-a",
  environment: "prod",
  generatedAt: new Date().toISOString(),
  flags: [
    {
      tenantId: "tenant-a",
      key: "new-homepage",
      name: "New Homepage",
      enabled: true,
      variants: { on: true, off: false },
      fallthroughVariant: "off",
      rules: [
        {
          id: "us-users",
          name: "US users",
          conditions: [{ attribute: "country", operator: "eq", value: "US" }],
          variant: "on",
          rolloutPercentage: 100
        }
      ],
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ] satisfies FeatureFlag[]
};

describe("FeatureFlagClient", () => {
  it("refreshes config and serves local evaluations", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify(snapshot), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    );

    const client = new FeatureFlagClient({
      baseUrl: "http://localhost:8080",
      token: "viewer-token",
      tenantId: "tenant-a",
      environment: "prod",
      pollIntervalMs: 0,
      fetchImpl: fetchMock as unknown as typeof fetch
    });

    await client.refresh();

    const value = client.variation("new-homepage", {
      context: { key: "user-1", attributes: { country: "US" } },
      defaultValue: false
    });

    expect(value).toBe(true);
  });

  it("returns default when refresh fails and no snapshot exists", async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error("network down");
    });

    const client = new FeatureFlagClient({
      baseUrl: "http://localhost:8080",
      token: "viewer-token",
      tenantId: "tenant-a",
      environment: "prod",
      pollIntervalMs: 0,
      fallbackMode: "serve_default",
      fetchImpl: fetchMock as unknown as typeof fetch
    });

    const value = await client.variationWithRefresh("new-homepage", {
      context: { key: "user-1", attributes: { country: "US" } },
      defaultValue: "off"
    });

    expect(value).toBe("off");
  });
});
