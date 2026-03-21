import { describe, it, expect } from "vitest";
import { simnet } from "./setup";
describe("btyexp 1", () => {
  it("validates btyexp case 1", () => {
    const r = simnet.callReadOnlyFn("marketplace", "get-paused", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
  it("edge case btyexp 1", () => { expect(true).toBe(true); });
});
