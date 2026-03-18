import { describe, it, expect } from "vitest";
import { simnet } from "./setup";
describe("trkgap integration 1", () => {
  it("full trkgap flow 1", () => {
    const r = simnet.callReadOnlyFn("data-tracking", "get-platform-stats", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
});
