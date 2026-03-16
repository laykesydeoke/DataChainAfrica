import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("tiers coexist with plans", () => {
  it("tiers coexist with plans", () => {
    const r = simnet.callReadOnlyFn("data-tracking", "get-tier-thresholds", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
