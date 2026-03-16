import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("validator claims reward", () => {
  it("validator claims reward", () => {
    const r = simnet.callReadOnlyFn("billing", "get-validator-params", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
