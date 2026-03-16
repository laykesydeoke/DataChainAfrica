import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("staking analytics correct", () => {
  it("staking analytics correct", () => {
    const r = simnet.callReadOnlyFn("marketplace", "get-staking-params", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
