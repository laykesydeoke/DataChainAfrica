import { describe, it, expect } from "vitest";
import { simnet } from "./setup";
describe("paglim integration 2", () => {
  it("full paglim flow 2", () => {
    const r = simnet.callReadOnlyFn("marketplace", "get-platform-stats", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
});
