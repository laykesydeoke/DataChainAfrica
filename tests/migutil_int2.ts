import { describe, it, expect } from "vitest";
import { simnet } from "./setup";
describe("migutil integration 2", () => {
  it("full migutil flow 2", () => {
    const r = simnet.callReadOnlyFn("marketplace", "get-platform-stats", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
});
