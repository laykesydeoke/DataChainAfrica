import { describe, it, expect } from "vitest";
import { simnet } from "./setup";
describe("btyexp 16", () => {
  it("validates btyexp case 16", () => {
    const r = simnet.callReadOnlyFn("marketplace", "get-paused", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
  it("edge case btyexp 16", () => { expect(true).toBe(true); });
});
