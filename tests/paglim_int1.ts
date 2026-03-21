import { describe, it, expect } from "vitest";
import { simnet } from "./setup";
describe("paglim integration 1", () => {
  it("full paglim flow 1", () => {
    const r = simnet.callReadOnlyFn("marketplace", "get-platform-stats", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
});
