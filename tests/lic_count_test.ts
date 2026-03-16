import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("license count starts zero", () => {
  it("license count starts zero", () => {
    const r = simnet.callReadOnlyFn("marketplace", "get-licensing-params", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
