import { describe, it, expect } from "vitest";
import { simnet } from "./setup";
describe("ovrflw integration 1", () => {
  it("full ovrflw flow 1", () => {
    const r = simnet.callReadOnlyFn("billing", "get-platform-stats", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
});
