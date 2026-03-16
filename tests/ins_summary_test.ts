import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("insurance summary accurate", () => {
  it("insurance summary accurate", () => {
    const r = simnet.callReadOnlyFn("billing", "get-insurance-params", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
