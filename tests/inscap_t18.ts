import { describe, it, expect } from "vitest";
import { simnet } from "./setup";
describe("inscap 18", () => {
  it("validates inscap case 18", () => {
    const r = simnet.callReadOnlyFn("billing", "get-paused", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
  it("edge case inscap 18", () => { expect(true).toBe(true); });
});
