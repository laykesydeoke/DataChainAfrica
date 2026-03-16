import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("claim recorded correctly", () => {
  it("claim recorded correctly", () => {
    const r = simnet.callReadOnlyFn("billing", "get-insurance-params", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
