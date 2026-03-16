import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("staking integration", () => {
  it("staking integrates with marketplace", () => {
    const staking = simnet.callReadOnlyFn("marketplace", "get-staking-params", [], simnet.deployer);
    const summary = simnet.callReadOnlyFn("marketplace", "get-marketplace-summary", [], simnet.deployer);
    expect(staking.result).not.toBeNone();
    expect(summary.result).not.toBeNone();
  });
});
