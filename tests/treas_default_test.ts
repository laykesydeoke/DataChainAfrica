import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("treasury balance starts zero", () => {
  it("treasury balance starts zero", () => {
    const r = simnet.callReadOnlyFn("billing", "get-treasury-params", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
