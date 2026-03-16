import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;

describe("activity summary reporting", () => {
  it("network stats aggregate across multiple users", () => {
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
      "subscribe-to-plan",
      [Cl.uint(1), Cl.bool(false)],
      wallet2
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
      [Cl.principal(wallet1), Cl.uint(100)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet2), Cl.uint(200)],
      deployer
    );
    const stats = simnet.callReadOnlyFn(
      "data-tracking",
      "get-network-stats",
      [],
      deployer
    );
    const total = Number(
      (stats.result as any).value?.data?.["total-data-recorded"]?.value ?? 0
    );
    expect(total).toBeGreaterThanOrEqual(300);
  });

  it("event counter increments after each usage", () => {
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
    const before = simnet.callReadOnlyFn(
      "data-tracking",
      "get-event-counter",
      [],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet1), Cl.uint(50)],
      deployer
    );
    const after = simnet.callReadOnlyFn(
      "data-tracking",
      "get-event-counter",
      [],
      deployer
    );
    expect(Number((after.result as any).value ?? 0)).toBeGreaterThan(
      Number((before.result as any).value ?? 0)
    );
  });
});
