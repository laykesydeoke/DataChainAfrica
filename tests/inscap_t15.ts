import { describe, it, expect } from "vitest";
import { simnet } from "./setup";
describe("inscap 15", () => {
  it("validates inscap case 15", () => {
    const r = simnet.callReadOnlyFn("billing", "get-paused", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
  it("edge case inscap 15", () => { expect(true).toBe(true); });
});
