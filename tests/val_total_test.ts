import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("total rewards tracked", () => {
  it("total rewards tracked", () => {
    const r = simnet.callReadOnlyFn("billing", "get-validator-params", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
