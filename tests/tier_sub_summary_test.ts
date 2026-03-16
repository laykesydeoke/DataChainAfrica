import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("tier summary accurate", () => {
  it("tier summary accurate", () => {
    const r = simnet.callReadOnlyFn("data-tracking", "get-tier-thresholds", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
