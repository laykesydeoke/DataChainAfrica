import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("licensing edge cases", () => {
  it("licensing edge cases", () => {
    const r = simnet.callReadOnlyFn("marketplace", "get-licensing-params", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
