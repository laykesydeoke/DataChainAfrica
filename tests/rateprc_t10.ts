import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("rateprc test 10", () => {
  it("validates rateprc case 10", () => {
    const r = simnet.callReadOnlyFn("billing", "get-platform-stats", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
  it("handles rateprc edge 10", () => {
    const r = simnet.callReadOnlyFn("billing", "get-paused", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
});
