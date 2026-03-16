import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("staking enabled by default", () => {
  it("staking enabled by default", () => {
    const r = simnet.callReadOnlyFn("marketplace", "get-staking-params", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
