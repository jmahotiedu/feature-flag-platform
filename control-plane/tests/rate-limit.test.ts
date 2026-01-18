import { describe, expect, it } from "vitest";
import request from "supertest";
import { makeApp } from "./helpers.js";

describe("rate limiting", () => {
  it("enforces tenant limits", async () => {
    const { app } = makeApp({ tenantRequestsPerMinute: 2, globalRequestsPerMinute: 100 });

    await request(app)
      .get("/api/flags")
      .set("Authorization", "Bearer viewer-token")
      .set("x-tenant-id", "tenant-rate")
      .expect(200);

    await request(app)
      .get("/api/flags")
      .set("Authorization", "Bearer viewer-token")
      .set("x-tenant-id", "tenant-rate")
      .expect(200);

    const limited = await request(app)
      .get("/api/flags")
      .set("Authorization", "Bearer viewer-token")
      .set("x-tenant-id", "tenant-rate");

    expect(limited.status).toBe(429);
  });
});
