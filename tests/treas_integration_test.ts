import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("protocol treasury integration", () => {
  it("treasury integrates with billing", () => {
    const params = simnet.callReadOnlyFn("billing", "get-treasury-params", [], simnet.deployer);
    expect(params.result).not.toBeNone();
  });
});
