import { describe, expect, it } from "vitest";
import { distributionBus, type DistributionEvent } from "../src/distribution/eventBus.js";
import { FlagVersionTracker } from "../src/distribution/versionTracker.js";

describe("distribution ordering and dedupe", () => {
  it("applies only monotonic versions for a flag", () => {
    const tracker = new FlagVersionTracker();
    const appliedVersions: number[] = [];

    const listener = (event: DistributionEvent) => {
      if (!tracker.shouldApply(event)) {
        return;
      }
      tracker.markApplied(event);
      appliedVersions.push(event.version);
    };

    distributionBus.onEvent(listener);
    const base = {
      type: "flag.published" as const,
      tenantId: "tenant-a",
      flagKey: "checkout",
      publishedAt: new Date().toISOString()
    };

    distributionBus.emitEvent({ ...base, version: 1 });
    distributionBus.emitEvent({ ...base, version: 2 });
    distributionBus.emitEvent({ ...base, version: 2 });
    distributionBus.emitEvent({ ...base, version: 1 });
    distributionBus.emitEvent({ ...base, version: 3 });
    distributionBus.offEvent(listener);

    expect(appliedVersions).toEqual([1, 2, 3]);
    expect(tracker.getLatestVersion("tenant-a", "checkout")).toBe(3);
  });

  it("tracks versions independently per flag", () => {
    const tracker = new FlagVersionTracker();
    const events: DistributionEvent[] = [
      {
        type: "flag.published",
        tenantId: "tenant-a",
        flagKey: "checkout",
        version: 2,
        publishedAt: new Date().toISOString()
      },
      {
        type: "flag.published",
        tenantId: "tenant-a",
        flagKey: "homepage",
        version: 1,
        publishedAt: new Date().toISOString()
      }
    ];

    for (const event of events) {
      expect(tracker.shouldApply(event)).toBe(true);
      tracker.markApplied(event);
    }

    expect(tracker.getLatestVersion("tenant-a", "checkout")).toBe(2);
    expect(tracker.getLatestVersion("tenant-a", "homepage")).toBe(1);
  });
});
