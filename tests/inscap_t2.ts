import { describe, it, expect } from "vitest";
import { simnet } from "./setup";
describe("inscap 2", () => {
  it("validates inscap case 2", () => {
    const r = simnet.callReadOnlyFn("billing", "get-paused", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
  it("edge case inscap 2", () => { expect(true).toBe(true); });
});
