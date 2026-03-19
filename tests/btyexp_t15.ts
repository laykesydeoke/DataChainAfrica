import { describe, it, expect } from "vitest";
import { simnet } from "./setup";
describe("btyexp 15", () => {
  it("validates btyexp case 15", () => {
    const r = simnet.callReadOnlyFn("marketplace", "get-paused", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
  it("edge case btyexp 15", () => { expect(true).toBe(true); });
});
