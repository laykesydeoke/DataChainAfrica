import { describe, it, expect } from "vitest";
import { simnet } from "./setup";
describe("migutil integration 1", () => {
  it("full migutil flow 1", () => {
    const r = simnet.callReadOnlyFn("marketplace", "get-platform-stats", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
});
