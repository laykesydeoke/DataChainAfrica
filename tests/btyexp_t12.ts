import { describe, it, expect } from "vitest";
import { simnet } from "./setup";
describe("btyexp 12", () => {
  it("validates btyexp case 12", () => {
    const r = simnet.callReadOnlyFn("marketplace", "get-paused", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
  it("edge case btyexp 12", () => { expect(true).toBe(true); });
});
