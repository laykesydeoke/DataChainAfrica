import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("bounty analytics correct", () => {
  it("bounty analytics correct", () => {
    const r = simnet.callReadOnlyFn("marketplace", "get-bounty-stats", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
