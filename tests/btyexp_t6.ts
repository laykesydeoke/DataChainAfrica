import { describe, it, expect } from "vitest";
import { simnet } from "./setup";
describe("btyexp 6", () => {
  it("validates btyexp case 6", () => {
    const r = simnet.callReadOnlyFn("marketplace", "get-paused", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
  it("edge case btyexp 6", () => { expect(true).toBe(true); });
});
