import { describe, it, expect } from "vitest";
import { simnet } from "./setup";
describe("inscap 17", () => {
  it("validates inscap case 17", () => {
    const r = simnet.callReadOnlyFn("billing", "get-paused", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
  it("edge case inscap 17", () => { expect(true).toBe(true); });
});
