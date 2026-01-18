import { describe, expect, it } from "vitest";
import type { FeatureFlag } from "@ff/shared";
import { MonotonicFlagCache } from "../src/stream.js";

function flag(version: number): FeatureFlag {
  return {
    tenantId: "tenant-a",
    key: "checkout",
    name: "Checkout",
    enabled: true,
    variants: { on: true, off: false },
    fallthroughVariant: "off",
    rules: [],
    version,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

describe("MonotonicFlagCache", () => {
  it("applies only increasing versions", () => {
    const cache = new MonotonicFlagCache();

    expect(cache.apply(flag(1))).toBe(true);
    expect(cache.apply(flag(2))).toBe(true);
    expect(cache.apply(flag(2))).toBe(false);
    expect(cache.apply(flag(1))).toBe(false);

    expect(cache.getVersion("checkout")).toBe(2);
  });

  it("dedupes and ignores out-of-order distribution events", () => {
    const cache = new MonotonicFlagCache();

    expect(
      cache.applyEvent({
        tenantId: "tenant-a",
        flagKey: "checkout",
        version: 3,
        publishedAt: new Date().toISOString()
      })
    ).toBe(true);

    expect(
      cache.applyEvent({
        tenantId: "tenant-a",
        flagKey: "checkout",
        version: 2,
        publishedAt: new Date().toISOString()
      })
    ).toBe(false);

    expect(cache.getVersion("checkout")).toBe(3);
  });
});
