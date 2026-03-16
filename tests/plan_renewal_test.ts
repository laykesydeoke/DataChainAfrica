import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("plan renewal governance", () => {
  it("auto-renew plan refreshes balance on expiry", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(3), Cl.uint(100)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "subscribe-to-plan",
      [Cl.uint(1), Cl.bool(true)],
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
      [Cl.principal(wallet1), Cl.uint(400)],
      deployer
    );
    simnet.mineEmptyBlocks(5);
    simnet.callPublicFn(
      "data-tracking",
      "process-plan-expiry",
      [Cl.principal(wallet1)],
      deployer
    );
    const data = simnet.callReadOnlyFn(
      "data-tracking",
      "get-user-data",
      [Cl.principal(wallet1)],
      wallet1
    );
    const balance = Number(
      (data.result as any).value?.data?.["data-balance"]?.value ?? 0
    );
    expect(balance).toBeGreaterThan(0);
  });

  it("manual-renew plan expires without refresh", () => {
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
    simnet.mineEmptyBlocks(5);
    const active = simnet.callReadOnlyFn(
      "data-tracking",
      "has-active-subscription",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(active.result).toBeBool(false);
  });
});
