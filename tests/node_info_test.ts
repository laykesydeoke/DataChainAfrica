import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("get-node-info returns data", () => {
  it("get-node-info returns data", () => {
    const r = simnet.callReadOnlyFn("data-tracking", "get-node-registry-params", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
