import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("base reward rate is set", () => {
  it("base reward rate is set", () => {
    const r = simnet.callReadOnlyFn("marketplace", "get-staking-params", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
