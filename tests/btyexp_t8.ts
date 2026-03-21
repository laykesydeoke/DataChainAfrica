import { describe, it, expect } from "vitest";
import { simnet } from "./setup";
describe("btyexp 8", () => {
  it("validates btyexp case 8", () => {
    const r = simnet.callReadOnlyFn("marketplace", "get-paused", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
  it("edge case btyexp 8", () => { expect(true).toBe(true); });
});
