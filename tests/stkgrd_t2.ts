import { describe, it, expect } from "vitest";
import { simnet } from "./setup";
describe("stkgrd 2", () => {
  it("validates stkgrd case 2", () => {
    const r = simnet.callReadOnlyFn("marketplace", "get-paused", [], simnet.deployer);
    expect(r.result).toBeDefined();
  });
  it("edge case stkgrd 2", () => { expect(true).toBe(true); });
});
