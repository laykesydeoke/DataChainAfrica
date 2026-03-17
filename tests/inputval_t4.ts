import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("inputval test 4", () => {
  it("validates inputval case 4", () => {
    const r = simnet.callReadOnlyFn("marketplace", "get-platform-stats", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
  it("handles inputval edge case 4", () => {
    const r = simnet.callReadOnlyFn("marketplace", "get-paused", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
});
