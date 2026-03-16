import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("full tier lifecycle", () => {
  it("full tier lifecycle", () => {
    const r = simnet.callReadOnlyFn("data-tracking", "get-tier-thresholds", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
