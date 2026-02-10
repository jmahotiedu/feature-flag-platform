import request from "supertest";
import { describe, expect, it } from "vitest";
import { makeApp, validFlagPayload } from "./helpers.js";

describe("tenant quotas", () => {
  it("enforces tenant flag quota", async () => {
    const { app } = makeApp({ tenantFlagQuota: 1 });

    await request(app)
      .post("/api/flags")
      .set("Authorization", "Bearer admin-token")
      .send(validFlagPayload)
      .expect(201);

    const second = await request(app)
      .post("/api/flags")
      .set("Authorization", "Bearer admin-token")
      .send({
        ...validFlagPayload,
        key: "second-flag",
        name: "Second Flag"
      });

    expect(second.status).toBe(429);
    expect(second.body.error).toContain("quota");
    expect(second.body.quota.maxFlags).toBe(1);
  });

  it("reports quota usage", async () => {
    const { app } = makeApp({ tenantFlagQuota: 2 });

    await request(app)
      .post("/api/flags")
      .set("Authorization", "Bearer admin-token")
      .send(validFlagPayload)
      .expect(201);

    const quota = await request(app)
      .get("/api/tenants/tenant-a/quotas")
      .set("Authorization", "Bearer viewer-token");

    expect(quota.status).toBe(200);
    expect(quota.body.quotas.maxFlags).toBe(2);
    expect(quota.body.quotas.usedFlags).toBe(1);
    expect(quota.body.quotas.remainingFlags).toBe(1);
  });
});
