import { describe, expect, it } from "vitest";
import request from "supertest";
import { makeApp, validFlagPayload } from "./helpers.js";

describe("idempotency middleware", () => {
  it("replays publish response for duplicate idempotency key", async () => {
    const { app } = makeApp();

    await request(app)
      .post("/api/flags")
      .set("Authorization", "Bearer admin-token")
      .send(validFlagPayload)
      .expect(201);

    const first = await request(app)
      .post("/api/flags/new-homepage/publish")
      .set("Authorization", "Bearer operator-token")
      .set("x-tenant-id", "tenant-a")
      .set("Idempotency-Key", "publish-1")
      .send({ tenantId: "tenant-a" });

    const second = await request(app)
      .post("/api/flags/new-homepage/publish")
      .set("Authorization", "Bearer operator-token")
      .set("x-tenant-id", "tenant-a")
      .set("Idempotency-Key", "publish-1")
      .send({ tenantId: "tenant-a" });

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(second.headers["idempotent-replay"]).toBe("true");
    expect(second.body.published.version).toBe(first.body.published.version);
  });
});
