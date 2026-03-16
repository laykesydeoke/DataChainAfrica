import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("node registry invariants", () => {
  it("node registry invariants", () => {
    const r = simnet.callReadOnlyFn("data-tracking", "get-node-registry-params", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
