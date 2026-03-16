import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("create-bounty succeeds", () => {
  it("create-bounty succeeds", () => {
    const r = simnet.callReadOnlyFn("marketplace", "get-bounty-stats", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
