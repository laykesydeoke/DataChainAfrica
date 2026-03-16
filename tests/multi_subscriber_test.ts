import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;
const wallet3 = simnet.getAccounts().get("wallet_3")!;

function setupPlan() {
  simnet.callPublicFn(
    "data-tracking",
    "set-data-plan",
    [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(100000000)],
    deployer
  );
}

function subscribeBilling(wallet: string) {
  simnet.callPublicFn(
    "billing",
    "subscribe-and-pay",
    [
      Cl.uint(1),
      Cl.contractPrincipal(deployer, "data-tracking"),
      Cl.uint(0),
    ],
    wallet
  );
}

describe("multiple subscribers", () => {
  it("two wallets can subscribe independently", () => {
    setupPlan();
    subscribeBilling(wallet1);
    subscribeBilling(wallet2);

    const sub1 = simnet.callReadOnlyFn(
      "billing",
      "get-subscription",
      [Cl.principal(wallet1)],
      wallet1
    );
    const sub2 = simnet.callReadOnlyFn(
      "billing",
      "get-subscription",
      [Cl.principal(wallet2)],
      wallet2
    );
    expect(sub1.result).toBeSome(
      expect.objectContaining({ type: expect.any(Number) })
    );
    expect(sub2.result).toBeSome(
      expect.objectContaining({ type: expect.any(Number) })
    );
  });

  it("total subscribers count reflects all subs", () => {
    setupPlan();
    subscribeBilling(wallet1);
    subscribeBilling(wallet2);
    subscribeBilling(wallet3);

    const result = simnet.callReadOnlyFn(
      "billing",
      "get-total-subscribers",
      [],
      deployer
    );
    expect(result.result).toBeUint(3);
  });

  it("payment counter increments per subscription", () => {
    setupPlan();
    subscribeBilling(wallet1);
    subscribeBilling(wallet2);

    const result = simnet.callReadOnlyFn(
      "billing",
      "get-total-payments",
      [],
      deployer
    );
    expect(result.result).toBeUint(2);
  });

  it("cancelling one does not affect another", () => {
    setupPlan();
    subscribeBilling(wallet1);
    subscribeBilling(wallet2);
    simnet.callPublicFn("billing", "cancel-subscription", [], wallet1);

    const status2 = simnet.callReadOnlyFn(
      "billing",
      "get-subscription-status",
      [Cl.principal(wallet2)],
      wallet2
    );
    expect(status2.result).toBeTuple({
      "is-active": Cl.bool(true),
      "days-remaining": expect.anything(),
      "current-discount": Cl.uint(0),
    });
  });

  it("each user has independent payment count", () => {
    setupPlan();
    subscribeBilling(wallet1);
    subscribeBilling(wallet1);
    subscribeBilling(wallet2);

    const count1 = simnet.callReadOnlyFn(
      "billing",
      "get-user-payment-count",
      [Cl.principal(wallet1)],
      wallet1
    );
    const count2 = simnet.callReadOnlyFn(
      "billing",
      "get-user-payment-count",
      [Cl.principal(wallet2)],
      wallet2
    );
    expect(count1.result).toBeUint(2);
    expect(count2.result).toBeUint(1);
  });
});
