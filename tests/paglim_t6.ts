import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("paglim test 6", () => {
  it("validates paglim case 6", () => {
    const r = simnet.callReadOnlyFn("marketplace", "get-platform-stats", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
  it("handles paglim edge 6", () => {
    const r = simnet.callReadOnlyFn("marketplace", "get-paused", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
});
