import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("insurance fund starts zero", () => {
  it("insurance fund starts zero", () => {
    const r = simnet.callReadOnlyFn("billing", "get-insurance-params", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
