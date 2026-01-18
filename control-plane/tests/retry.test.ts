import { describe, expect, it } from "vitest";
import { computeBackoffDelay, withRetry } from "../src/resilience/retry.js";

describe("retry backoff", () => {
  it("retries with exponential backoff and succeeds", async () => {
    let attempts = 0;
    const delays: number[] = [];

    const result = await withRetry(
      async () => {
        attempts += 1;
        if (attempts < 3) {
          throw new Error("transient");
        }
        return "ok";
      },
      {
        maxAttempts: 5,
        baseDelayMs: 50,
        maxDelayMs: 500,
        jitterRatio: 0
      },
      {
        sleep: async (ms) => {
          delays.push(ms);
        }
      }
    );

    expect(result).toBe("ok");
    expect(attempts).toBe(3);
    expect(delays).toEqual([50, 100]);
  });

  it("throws after max attempts", async () => {
    let attempts = 0;

    await expect(
      withRetry(
        async () => {
          attempts += 1;
          throw new Error("always failing");
        },
        {
          maxAttempts: 3,
          baseDelayMs: 10,
          maxDelayMs: 100,
          jitterRatio: 0
        },
        {
          sleep: async () => {
            // no-op in tests
          }
        }
      )
    ).rejects.toThrow("always failing");

    expect(attempts).toBe(3);
  });

  it("computes jittered delays within bounds", () => {
    const delay = computeBackoffDelay(
      2,
      {
        maxAttempts: 4,
        baseDelayMs: 100,
        maxDelayMs: 500,
        jitterRatio: 0.2
      },
      () => 1
    );

    expect(delay).toBeGreaterThanOrEqual(160);
    expect(delay).toBeLessThanOrEqual(240);
  });
});
