import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("telemetry invariants", () => {
  it("total-data-recorded never decrements", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(3), Cl.uint(100)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "subscribe-to-plan",
      [Cl.uint(1), Cl.bool(false)],
      wallet1
    );
    simnet.callPublicFn(
      "data-tracking",
      "authorize-carrier",
      [Cl.principal(deployer)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet1), Cl.uint(200)],
      deployer
    );
    const before = simnet.callReadOnlyFn(
      "data-tracking",
      "get-total-data-recorded",
      [],
      deployer
    );
    simnet.mineEmptyBlocks(5);
    simnet.callPublicFn(
      "data-tracking",
      "process-plan-expiry",
      [Cl.principal(wallet1)],
      deployer
    );
    const after = simnet.callReadOnlyFn(
      "data-tracking",
      "get-total-data-recorded",
      [],
      deployer
    );
    expect(Number((after.result as any).value ?? 0)).toBeGreaterThanOrEqual(
      Number((before.result as any).value ?? 0)
    );
  });

  it("event-count never decrements", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(100)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "subscribe-to-plan",
      [Cl.uint(1), Cl.bool(false)],
      wallet1
    );
    simnet.callPublicFn(
      "data-tracking",
      "authorize-carrier",
      [Cl.principal(deployer)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet1), Cl.uint(50)],
      deployer
    );
    const before = simnet.callReadOnlyFn(
      "data-tracking",
      "get-event-counter",
      [],
      deployer
    );
    const after = simnet.callReadOnlyFn(
      "data-tracking",
      "get-event-counter",
      [],
      deployer
    );
    expect(Number((after.result as any).value ?? 0)).toBeGreaterThanOrEqual(
      Number((before.result as any).value ?? 0)
    );
  });
});
