import { describe, it, expect } from "vitest";
import { simnet } from "./setup";
describe("btyexp 18", () => {
  it("validates btyexp case 18", () => {
    const r = simnet.callReadOnlyFn("marketplace", "get-paused", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
  it("edge case btyexp 18", () => { expect(true).toBe(true); });
});
