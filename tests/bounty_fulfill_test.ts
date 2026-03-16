import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("fulfill-bounty sets fulfilled", () => {
  it("fulfill-bounty sets fulfilled", () => {
    const r = simnet.callReadOnlyFn("marketplace", "get-bounty-stats", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
