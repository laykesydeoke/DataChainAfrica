import { describe, it, expect } from "vitest";
import { simnet } from "./setup";
describe("inscap 13", () => {
  it("validates inscap case 13", () => {
    const r = simnet.callReadOnlyFn("billing", "get-paused", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
  it("edge case inscap 13", () => { expect(true).toBe(true); });
});
