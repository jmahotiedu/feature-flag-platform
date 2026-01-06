import { describe, expect, it } from "vitest";
import { evaluateFlag, stableBucket, validateFlagInput, type FeatureFlag } from "../src/index.js";

const baseFlag: FeatureFlag = {
  tenantId: "tenant-1",
  key: "checkout-redesign",
  name: "Checkout Redesign",
  enabled: true,
  variants: { on: true, off: false },
  fallthroughVariant: "off",
  rules: [
    {
      id: "us-users",
      name: "US Users",
      conditions: [{ attribute: "country", operator: "eq", value: "US" }],
      variant: "on",
      rolloutPercentage: 100
    }
  ],
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

describe("evaluation", () => {
  it("matches rule when predicates pass", () => {
    const result = evaluateFlag(baseFlag, {
      key: "user-123",
      attributes: { country: "US" }
    });
    expect(result.variantKey).toBe("on");
    expect(result.reason).toBe("rule_match");
  });

  it("is deterministic for same seed", () => {
    expect(stableBucket("abc")).toBe(stableBucket("abc"));
  });

  it("validates required properties", () => {
    const result = validateFlagInput({ key: "missing-tenant" });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
