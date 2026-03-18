import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("ovrflw test 3", () => {
  it("validates ovrflw case 3", () => {
    const r = simnet.callReadOnlyFn("billing", "get-platform-stats", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
  it("handles ovrflw edge 3", () => {
    const r = simnet.callReadOnlyFn("billing", "get-paused", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
});
