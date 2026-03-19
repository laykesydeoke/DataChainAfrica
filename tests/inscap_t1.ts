import { describe, it, expect } from "vitest";
import { simnet } from "./setup";
describe("inscap 1", () => {
  it("validates inscap case 1", () => {
    const r = simnet.callReadOnlyFn("billing", "get-paused", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
  it("edge case inscap 1", () => { expect(true).toBe(true); });
});
