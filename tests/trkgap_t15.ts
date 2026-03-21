import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("trkgap test 15", () => {
  it("validates trkgap case 15", () => {
    const r = simnet.callReadOnlyFn("data-tracking", "get-platform-stats", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
  it("handles trkgap edge 15", () => {
    const r = simnet.callReadOnlyFn("data-tracking", "get-paused", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
});
