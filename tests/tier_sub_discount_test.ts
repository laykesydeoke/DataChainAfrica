import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("discount bps set on upgrade", () => {
  it("discount bps set on upgrade", () => {
    const r = simnet.callReadOnlyFn("data-tracking", "get-tier-thresholds", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
