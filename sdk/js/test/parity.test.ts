import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { evaluateForSdk } from "../src/eval.js";

const fixtures = JSON.parse(
  readFileSync(new URL("../../../shared/fixtures/eval-fixtures.json", import.meta.url), "utf8")
) as Array<{
  flag: unknown;
  context: unknown;
  expectedVariant: string;
}>;

describe("evaluation parity fixtures", () => {
  it("matches expected variants from shared fixtures", () => {
    for (const fixture of fixtures) {
      const value = evaluateForSdk(fixture.flag as never, fixture.context as never);
      if (fixture.expectedVariant === "on") {
        expect(value).toBe(true);
      } else {
        expect(value).toBe(false);
      }
    }
  });
});
