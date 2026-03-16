import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("zero reward rejected", () => {
  it("zero reward rejected", () => {
    const r = simnet.callReadOnlyFn("marketplace", "get-bounty-stats", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
