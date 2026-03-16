import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("license active flag", () => {
  it("license active flag", () => {
    const r = simnet.callReadOnlyFn("marketplace", "get-licensing-params", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
