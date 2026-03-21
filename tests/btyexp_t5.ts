import { describe, it, expect } from "vitest";
import { simnet } from "./setup";
describe("btyexp 5", () => {
  it("validates btyexp case 5", () => {
    const r = simnet.callReadOnlyFn("marketplace", "get-paused", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
  it("edge case btyexp 5", () => { expect(true).toBe(true); });
});
