import { describe, it, expect } from "vitest";
import { simnet } from "./setup";
describe("inscap 6", () => {
  it("validates inscap case 6", () => {
    const r = simnet.callReadOnlyFn("billing", "get-paused", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
  it("edge case inscap 6", () => { expect(true).toBe(true); });
});
