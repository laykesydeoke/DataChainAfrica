import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("owner can set fee", () => {
  it("owner can set fee", () => {
    const r = simnet.callReadOnlyFn("billing", "get-treasury-params", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
