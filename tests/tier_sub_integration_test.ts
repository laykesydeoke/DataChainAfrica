import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("subscription tier integration", () => {
  it("tiers integrate with data-tracking", () => {
    const tiers = simnet.callReadOnlyFn("data-tracking", "get-tier-thresholds", [], simnet.deployer);
    expect(tiers.result).not.toBeNone();
  });
});
