import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("billing full flow integration", () => {
  it("subscribe, cancel, renew, check status", () => {
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

    const afterSub = simnet.callReadOnlyFn(
      "billing", "is-payment-due", [Cl.principal(wallet1)], wallet1
    );
    expect(afterSub.result).toBeBool(false);

    simnet.callPublicFn("billing", "cancel-subscription", [], wallet1);

    const afterCancel = simnet.callReadOnlyFn(
      "billing", "get-grace-period-remaining", [Cl.principal(wallet1)], wallet1
    );
    const remaining = Number((afterCancel.result as any).value ?? 0);
    expect(remaining).toBeGreaterThan(0);

    simnet.callPublicFn(
      "billing",
      "process-renewal-payment",
      [Cl.contractPrincipal(deployer, "data-tracking")],
      wallet1
    );

    const afterRenew = simnet.callReadOnlyFn(
      "billing", "is-payment-due", [Cl.principal(wallet1)], wallet1
    );
    expect(afterRenew.result).toBeBool(false);
  });

  it("total payments reflects subscribe + renewal", () => {
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
    simnet.callPublicFn("billing", "cancel-subscription", [], wallet1);
    simnet.callPublicFn(
      "billing",
      "process-renewal-payment",
      [Cl.contractPrincipal(deployer, "data-tracking")],
      wallet1
    );

    const count = simnet.callReadOnlyFn(
      "billing", "get-user-payment-count", [Cl.principal(wallet1)], wallet1
    );
    expect(count.result).toBeUint(2);
  });
});
