import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("contract invariants", () => {
  it("balance never goes negative", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(100), Cl.uint(500), Cl.uint(100)],
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

    const overUse = simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet1), Cl.uint(200)],
      deployer
    );
    expect(overUse.result).toBeErr(Cl.uint(102));

    const data = simnet.callReadOnlyFn(
      "data-tracking",
      "get-user-data",
      [Cl.principal(wallet1)],
      wallet1
    );
    const balance = Number(
      (data.result as any).value?.data?.["data-balance"]?.value ?? 0
    );
    expect(balance).toBeGreaterThanOrEqual(0);
  });

  it("payment counter never decrements", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(100000000)],
      deployer
    );
    simnet.callPublicFn(
      "billing",
      "subscribe-and-pay",
      [Cl.uint(1), Cl.contractPrincipal(deployer, "data-tracking"), Cl.uint(0)],
      wallet1
    );

    const before = simnet.callReadOnlyFn("billing", "get-total-payments", [], deployer);
    simnet.callPublicFn("billing", "cancel-subscription", [], wallet1);
    const after = simnet.callReadOnlyFn("billing", "get-total-payments", [], deployer);

    expect(Number((after.result as any).value ?? 0)).toBeGreaterThanOrEqual(
      Number((before.result as any).value ?? 0)
    );
  });
});
