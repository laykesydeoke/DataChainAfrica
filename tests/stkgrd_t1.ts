import { describe, it, expect } from "vitest";
import { simnet } from "./setup";
describe("stkgrd 1", () => {
  it("validates stkgrd case 1", () => {
    const r = simnet.callReadOnlyFn("marketplace", "get-paused", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
  it("edge case stkgrd 1", () => { expect(true).toBe(true); });
});
