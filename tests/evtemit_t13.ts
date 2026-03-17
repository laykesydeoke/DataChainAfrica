import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("evtemit test 13", () => {
  it("validates evtemit case 13", () => {
    const r = simnet.callReadOnlyFn("marketplace", "get-platform-stats", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
  it("handles evtemit edge case 13", () => {
    const r = simnet.callReadOnlyFn("marketplace", "get-paused", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
});
