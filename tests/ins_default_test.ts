import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("insurance defaults correct", () => {
  it("insurance defaults correct", () => {
    const r = simnet.callReadOnlyFn("billing", "get-insurance-params", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
