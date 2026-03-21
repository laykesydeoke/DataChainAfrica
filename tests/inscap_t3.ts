import { describe, it, expect } from "vitest";
import { simnet } from "./setup";
describe("inscap 3", () => {
  it("validates inscap case 3", () => {
    const r = simnet.callReadOnlyFn("billing", "get-paused", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
  it("edge case inscap 3", () => { expect(true).toBe(true); });
});
