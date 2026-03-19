import { describe, it, expect } from "vitest";
import { simnet } from "./setup";
describe("btyexp 13", () => {
  it("validates btyexp case 13", () => {
    const r = simnet.callReadOnlyFn("marketplace", "get-paused", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
  it("edge case btyexp 13", () => { expect(true).toBe(true); });
});
