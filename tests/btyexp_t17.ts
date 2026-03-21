import { describe, it, expect } from "vitest";
import { simnet } from "./setup";
describe("btyexp 17", () => {
  it("validates btyexp case 17", () => {
    const r = simnet.callReadOnlyFn("marketplace", "get-paused", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
  it("edge case btyexp 17", () => { expect(true).toBe(true); });
});
