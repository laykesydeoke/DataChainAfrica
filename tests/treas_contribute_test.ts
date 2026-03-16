import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("contribute to treasury", () => {
  it("contribute to treasury", () => {
    const r = simnet.callReadOnlyFn("billing", "get-treasury-params", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
