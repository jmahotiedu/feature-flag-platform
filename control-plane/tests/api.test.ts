import { describe, expect, it } from "vitest";
import request from "supertest";
import { makeApp, validFlagPayload } from "./helpers.js";

describe("feature flag api", () => {
  it("creates, evaluates, publishes, and lists history", async () => {
    const { app } = makeApp();

    const createResponse = await request(app)
      .post("/api/flags")
      .set("Authorization", "Bearer admin-token")
      .send(validFlagPayload);

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.flag.version).toBe(1);

    const evaluateResponse = await request(app)
      .post("/api/evaluate")
      .set("Authorization", "Bearer viewer-token")
      .send({
        tenantId: "tenant-a",
        flagKey: "new-homepage",
        context: {
          key: "user-1",
          attributes: { country: "US" }
        }
      });

    expect(evaluateResponse.status).toBe(200);
    expect(evaluateResponse.body.result.variantKey).toBe("on");

    const publishResponse = await request(app)
      .post("/api/flags/new-homepage/publish")
      .set("Authorization", "Bearer operator-token")
      .set("x-tenant-id", "tenant-a")
      .send({ tenantId: "tenant-a" });

    expect(publishResponse.status).toBe(201);
    expect(publishResponse.body.published.version).toBe(2);

    const rollbackResponse = await request(app)
      .post("/api/flags/new-homepage/rollback")
      .set("Authorization", "Bearer operator-token")
      .set("x-tenant-id", "tenant-a")
      .send({ tenantId: "tenant-a", targetVersion: 2 });

    expect(rollbackResponse.status).toBe(200);
    expect(rollbackResponse.body.rolledBack.version).toBe(3);

    const historyResponse = await request(app)
      .get("/api/flags/new-homepage/history")
      .set("Authorization", "Bearer viewer-token")
      .set("x-tenant-id", "tenant-a");

    expect(historyResponse.status).toBe(200);
    expect(historyResponse.body.history.length).toBeGreaterThanOrEqual(2);
    const versions = historyResponse.body.history.map((entry: { version: number }) => entry.version);
    expect(versions).toContain(3);

    const auditResponse = await request(app)
      .get("/api/audit")
      .set("Authorization", "Bearer viewer-token")
      .set("x-tenant-id", "tenant-a");

    expect(auditResponse.status).toBe(200);
    expect(auditResponse.body.events.length).toBeGreaterThanOrEqual(3);
    expect(auditResponse.body.events[0].actor).toBeDefined();
    expect(auditResponse.body.events[0].createdAt).toBeDefined();
    expect(auditResponse.body.events[0].diff).toBeTruthy();
    const actions = auditResponse.body.events.map((event: { action: string }) => event.action);
    expect(actions).toContain("flag.rolled_back");
  });

  it("rejects invalid flag payload", async () => {
    const { app } = makeApp();

    const response = await request(app)
      .post("/api/flags")
      .set("Authorization", "Bearer admin-token")
      .send({
        tenantId: "tenant-a",
        key: "broken",
        name: "Broken",
        variants: {},
        fallthroughVariant: "off",
        rules: []
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("invalid");
  });
});
