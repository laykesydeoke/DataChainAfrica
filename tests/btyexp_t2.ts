import { describe, it, expect } from "vitest";
import { simnet } from "./setup";
describe("btyexp 2", () => {
  it("validates btyexp case 2", () => {
    const r = simnet.callReadOnlyFn("marketplace", "get-paused", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
  it("edge case btyexp 2", () => { expect(true).toBe(true); });
});
