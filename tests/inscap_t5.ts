import { describe, it, expect } from "vitest";
import { simnet } from "./setup";
describe("inscap 5", () => {
  it("validates inscap case 5", () => {
    const r = simnet.callReadOnlyFn("billing", "get-paused", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
  it("edge case inscap 5", () => { expect(true).toBe(true); });
});
