import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("reputation system integration", () => {
  it("reputation integrates with marketplace", () => {
    const params = simnet.callReadOnlyFn("marketplace", "get-reputation-params", [], simnet.deployer);
    const market = simnet.callReadOnlyFn("marketplace", "get-marketplace-summary", [], simnet.deployer);
    expect(params.result).not.toBeNone();
    expect(market.result).not.toBeNone();
  });
});
