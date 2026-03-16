import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("data retention on-chain", () => {
  it("usage events persist after plan expiry", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(2), Cl.uint(100)],
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
      [Cl.principal(wallet1), Cl.uint(100)],
      deployer
    );
    simnet.mineEmptyBlocks(5);
    const event = simnet.callReadOnlyFn(
      "data-tracking",
      "get-usage-event",
      [Cl.uint(1)],
      deployer
    );
    expect(event.result).not.toBeNone();
  });

  it("total data recorded remains after plan expiry", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(2), Cl.uint(100)],
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
      [Cl.principal(wallet1), Cl.uint(300)],
      deployer
    );
    simnet.mineEmptyBlocks(5);
    const stats = simnet.callReadOnlyFn(
      "data-tracking",
      "get-network-stats",
      [],
      deployer
    );
    const total = Number(
      (stats.result as any).value?.data?.["total-data-recorded"]?.value ?? 0
    );
    expect(total).toBeGreaterThan(0);
  });
});
