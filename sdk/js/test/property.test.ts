import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { evaluateForSdk } from "../src/eval.js";
import type { FeatureFlag } from "@ff/shared";

const flag: FeatureFlag = {
  tenantId: "tenant-1",
  key: "exp-flag",
  name: "Experiment",
  enabled: true,
  variants: { on: true, off: false },
  fallthroughVariant: "off",
  rules: [
    {
      id: "percent-rollout",
      name: "50 percent",
      conditions: [],
      variant: "on",
      rolloutPercentage: 50
    }
  ],
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

describe("property tests", () => {
  it("is deterministic for repeated evaluations", () => {
    fc.assert(
      fc.property(fc.string(), (key) => {
        const context = { key, attributes: {} };
        const first = evaluateForSdk(flag, context);
        const second = evaluateForSdk(flag, context);
        expect(first).toBe(second);
      })
    );
  });
});
