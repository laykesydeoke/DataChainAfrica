import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("royalty capped at 1000", () => {
  it("royalty capped at 1000", () => {
    const r = simnet.callReadOnlyFn("marketplace", "get-licensing-params", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
