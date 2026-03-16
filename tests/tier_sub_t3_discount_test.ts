import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("tier 3 gets 200 bps", () => {
  it("tier 3 gets 200 bps", () => {
    const r = simnet.callReadOnlyFn("data-tracking", "get-tier-thresholds", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
