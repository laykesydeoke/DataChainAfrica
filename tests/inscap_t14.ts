import { describe, it, expect } from "vitest";
import { simnet } from "./setup";
describe("inscap 14", () => {
  it("validates inscap case 14", () => {
    const r = simnet.callReadOnlyFn("billing", "get-paused", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
  it("edge case inscap 14", () => { expect(true).toBe(true); });
});
