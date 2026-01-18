import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { InMemoryFeatureFlagStore } from "../src/store/memoryStore.js";
import type { FeatureFlagStore } from "../src/store/types.js";
import { makeConfig, validFlagPayload } from "./helpers.js";

class FaultInjectingStore implements FeatureFlagStore {
  private readonly base = new InMemoryFeatureFlagStore();

  public failNextPublish = false;
  public failNextListFlags = false;

  createEnvironment(...args: Parameters<FeatureFlagStore["createEnvironment"]>) {
    return this.base.createEnvironment(...args);
  }

  listEnvironments(...args: Parameters<FeatureFlagStore["listEnvironments"]>) {
    return this.base.listEnvironments(...args);
  }

  createSegment(...args: Parameters<FeatureFlagStore["createSegment"]>) {
    return this.base.createSegment(...args);
  }

  listSegments(...args: Parameters<FeatureFlagStore["listSegments"]>) {
    return this.base.listSegments(...args);
  }

  createFlag(...args: Parameters<FeatureFlagStore["createFlag"]>) {
    return this.base.createFlag(...args);
  }

  updateFlag(...args: Parameters<FeatureFlagStore["updateFlag"]>) {
    return this.base.updateFlag(...args);
  }

  getFlag(...args: Parameters<FeatureFlagStore["getFlag"]>) {
    return this.base.getFlag(...args);
  }

  listFlags(...args: Parameters<FeatureFlagStore["listFlags"]>) {
    if (this.failNextListFlags) {
      this.failNextListFlags = false;
      throw new Error("injected list failure");
    }
    return this.base.listFlags(...args);
  }

  publishFlag(...args: Parameters<FeatureFlagStore["publishFlag"]>) {
    if (this.failNextPublish) {
      this.failNextPublish = false;
      throw new Error("injected publish failure");
    }
    return this.base.publishFlag(...args);
  }

  rollbackFlagToVersion(...args: Parameters<FeatureFlagStore["rollbackFlagToVersion"]>) {
    return this.base.rollbackFlagToVersion(...args);
  }

  listFlagHistory(...args: Parameters<FeatureFlagStore["listFlagHistory"]>) {
    return this.base.listFlagHistory(...args);
  }

  appendAudit(...args: Parameters<FeatureFlagStore["appendAudit"]>) {
    return this.base.appendAudit(...args);
  }

  listAudit(...args: Parameters<FeatureFlagStore["listAudit"]>) {
    return this.base.listAudit(...args);
  }
}

describe("fault injection integration", () => {
  it("recovers after injected publish failure and exposes error metrics", async () => {
    const store = new FaultInjectingStore();
    const app = createApp({
      config: makeConfig(),
      store
    });

    await request(app)
      .post("/api/flags")
      .set("Authorization", "Bearer admin-token")
      .send(validFlagPayload)
      .expect(201);

    store.failNextPublish = true;

    const failedPublish = await request(app)
      .post("/api/flags/new-homepage/publish")
      .set("Authorization", "Bearer operator-token")
      .set("x-tenant-id", "tenant-a")
      .send({ tenantId: "tenant-a" });

    expect(failedPublish.status).toBe(500);
    expect(failedPublish.body.error).toBe("internal_error");

    const recoveredPublish = await request(app)
      .post("/api/flags/new-homepage/publish")
      .set("Authorization", "Bearer operator-token")
      .set("x-tenant-id", "tenant-a")
      .send({ tenantId: "tenant-a" });

    expect(recoveredPublish.status).toBe(201);

    const metrics = await request(app).get("/api/metrics");
    expect(metrics.status).toBe(200);
    expect(metrics.text).toContain('ff_http_requests_total');
    expect(metrics.text).toContain('status="500"');
  });

  it("recovers after injected list failure", async () => {
    const store = new FaultInjectingStore();
    const app = createApp({
      config: makeConfig(),
      store
    });

    store.failNextListFlags = true;

    const firstAttempt = await request(app)
      .get("/api/flags")
      .set("Authorization", "Bearer viewer-token")
      .set("x-tenant-id", "tenant-a");

    expect(firstAttempt.status).toBe(500);
    expect(firstAttempt.body.error).toBe("internal_error");

    const secondAttempt = await request(app)
      .get("/api/flags")
      .set("Authorization", "Bearer viewer-token")
      .set("x-tenant-id", "tenant-a");

    expect(secondAttempt.status).toBe(200);
    expect(secondAttempt.body.flags).toEqual([]);
  });
});
