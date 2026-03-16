import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("node registry integration", () => {
  it("node registry integrates with data-tracking", () => {
    const nodes = simnet.callReadOnlyFn("data-tracking", "get-node-registry-params", [], simnet.deployer);
    expect(nodes.result).not.toBeNone();
  });
});
