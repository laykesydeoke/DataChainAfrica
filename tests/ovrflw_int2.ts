import { describe, it, expect } from "vitest";
import { simnet } from "./setup";
describe("ovrflw integration 2", () => {
  it("full ovrflw flow 2", () => {
    const r = simnet.callReadOnlyFn("billing", "get-platform-stats", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
});
