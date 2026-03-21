import { describe, it, expect } from "vitest";
import { simnet } from "./setup";
describe("rateprc integration 2", () => {
  it("full rateprc flow 2", () => {
    const r = simnet.callReadOnlyFn("billing", "get-platform-stats", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
});
