import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("get-bounty returns data", () => {
  it("get-bounty returns data", () => {
    const r = simnet.callReadOnlyFn("marketplace", "get-bounty-stats", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
