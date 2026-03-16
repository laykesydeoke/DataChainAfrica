import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("validator rewards integration", () => {
  it("validator rewards integrates with billing", () => {
    const params = simnet.callReadOnlyFn("billing", "get-validator-params", [], simnet.deployer);
    expect(params.result).not.toBeNone();
  });
});
