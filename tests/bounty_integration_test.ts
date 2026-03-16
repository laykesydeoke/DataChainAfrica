import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("bounty integration", () => {
  it("bounty system integrates with marketplace", () => {
    const stats = simnet.callReadOnlyFn("marketplace", "get-bounty-stats", [], simnet.deployer);
    const market = simnet.callReadOnlyFn("marketplace", "get-marketplace-summary", [], simnet.deployer);
    expect(stats.result).not.toBeNone();
    expect(market.result).not.toBeNone();
  });
});
