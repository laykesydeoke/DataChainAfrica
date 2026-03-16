import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("data insurance integration", () => {
  it("insurance integrates with billing", () => {
    const params = simnet.callReadOnlyFn("billing", "get-insurance-params", [], simnet.deployer);
    expect(params.result).not.toBeNone();
  });
});
