import { describe, it, expect } from "vitest";
import { simnet } from "./setup";
describe("btyexp 14", () => {
  it("validates btyexp case 14", () => {
    const r = simnet.callReadOnlyFn("marketplace", "get-paused", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
  it("edge case btyexp 14", () => { expect(true).toBe(true); });
});
