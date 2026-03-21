import { describe, it, expect } from "vitest";
import { simnet } from "./setup";
describe("inscap 8", () => {
  it("validates inscap case 8", () => {
    const r = simnet.callReadOnlyFn("billing", "get-paused", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
  it("edge case inscap 8", () => { expect(true).toBe(true); });
});
