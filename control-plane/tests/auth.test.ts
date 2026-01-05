import { describe, expect, it } from "vitest";
import request from "supertest";
import { makeApp, validFlagPayload } from "./helpers.js";

describe("auth middleware", () => {
  it("requires bearer token", async () => {
    const { app } = makeApp();
    const response = await request(app)
      .get("/api/flags")
      .set("x-tenant-id", "tenant-a");

    expect(response.status).toBe(401);
  });

  it("enforces role permissions", async () => {
    const { app } = makeApp();
    const response = await request(app)
      .post("/api/flags")
      .set("Authorization", "Bearer viewer-token")
      .send(validFlagPayload);

    expect(response.status).toBe(403);
  });
});
