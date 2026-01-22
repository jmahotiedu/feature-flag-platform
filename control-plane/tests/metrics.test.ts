import { describe, expect, it } from "vitest";
import request from "supertest";
import { makeApp } from "./helpers.js";

describe("metrics endpoint", () => {
  it("exposes ff_* metrics series", async () => {
    const { app } = makeApp();

    await request(app)
      .get("/api/flags")
      .set("Authorization", "Bearer viewer-token")
      .set("x-tenant-id", "tenant-metrics")
      .expect(200);

    const response = await request(app).get("/api/metrics");
    expect(response.status).toBe(200);
    expect(response.text).toContain("ff_http_requests_total");
    expect(response.text).toContain("ff_http_request_duration_ms");
  });
});
