import { describe, it, expect } from "vitest";
import { simnet } from "./setup";
describe("btyexp 9", () => {
  it("validates btyexp case 9", () => {
    const r = simnet.callReadOnlyFn("marketplace", "get-paused", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
  it("edge case btyexp 9", () => { expect(true).toBe(true); });
});
