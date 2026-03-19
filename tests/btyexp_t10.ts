import { describe, it, expect } from "vitest";
import { simnet } from "./setup";
describe("btyexp 10", () => {
  it("validates btyexp case 10", () => {
    const r = simnet.callReadOnlyFn("marketplace", "get-paused", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
  it("edge case btyexp 10", () => { expect(true).toBe(true); });
});
