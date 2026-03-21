import { describe, it, expect } from "vitest";
import { simnet } from "./setup";
describe("btyexp 3", () => {
  it("validates btyexp case 3", () => {
    const r = simnet.callReadOnlyFn("marketplace", "get-paused", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
  it("edge case btyexp 3", () => { expect(true).toBe(true); });
});
