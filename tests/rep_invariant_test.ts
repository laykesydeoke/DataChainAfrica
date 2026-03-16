import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("reputation invariants", () => {
  it("reputation invariants", () => {
    const r = simnet.callReadOnlyFn("marketplace", "get-reputation-params", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
