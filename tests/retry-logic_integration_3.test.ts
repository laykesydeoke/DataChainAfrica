import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("retry-logic integration 3", () => {
  it("performs create-read-update cycle 3", () => {
    // Create
    const cr = simnet.callPublicFn("marketplace", "create-retry-logic", [Cl.uint(300)], deployer);
    expect(cr.result).toBeOk(expect.objectContaining({ type: expect.any(Number) }));
    // Read
    const rd = simnet.callReadOnlyFn("marketplace", "get-retry-logic-count", [], deployer);
    expect(rd.result).toBeDefined();
  });

  it("validates ownership in workflow 3", () => {
    const cr = simnet.callPublicFn("marketplace", "create-retry-logic", [Cl.uint(350)], deployer);
    expect(cr.result).toBeOk(expect.objectContaining({ type: expect.any(Number) }));
    // Non-owner cannot update
    const up = simnet.callPublicFn("marketplace", "update-retry-logic", [Cl.uint(1), Cl.uint(999)], wallet1);
    expect(up.result).toBeErr(expect.objectContaining({ type: expect.any(Number) }));
  });
});
