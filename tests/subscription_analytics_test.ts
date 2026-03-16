import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;

describe("subscription analytics", () => {
  it("get-total-payments returns payment counter", () => {
    const result = simnet.callReadOnlyFn(
      "billing",
      "get-total-payments",
      [],
      deployer
    );
    expect(result.result).toBeUint(0);
  });

  it("payment counter increments after subscribe", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(100000000)],
      deployer
    );
    simnet.callPublicFn(
      "billing",
      "subscribe-and-pay",
      [
        Cl.uint(1),
        Cl.contractPrincipal(deployer, "data-tracking"),
        Cl.uint(0),
      ],
      wallet1
    );

    const result = simnet.callReadOnlyFn(
      "billing",
      "get-total-payments",
      [],
      deployer
    );
    expect(result.result).toBeUint(1);
  });

  it("multiple subscribers tracked independently", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(100000000)],
      deployer
    );
    simnet.callPublicFn(
      "billing",
      "subscribe-and-pay",
      [
        Cl.uint(1),
        Cl.contractPrincipal(deployer, "data-tracking"),
        Cl.uint(0),
      ],
      wallet1
    );
    simnet.callPublicFn(
      "billing",
      "subscribe-and-pay",
      [
        Cl.uint(1),
        Cl.contractPrincipal(deployer, "data-tracking"),
        Cl.uint(0),
      ],
      wallet2
    );

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
    expect(count1.result).toBeUint(1);
    expect(count2.result).toBeUint(1);
  });

  it("subscription status shows active after subscribe", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(100000000)],
      deployer
    );
    simnet.callPublicFn(
      "billing",
      "subscribe-and-pay",
      [
        Cl.uint(1),
        Cl.contractPrincipal(deployer, "data-tracking"),
        Cl.uint(0),
      ],
      wallet1
    );

    const status = simnet.callReadOnlyFn(
      "billing",
      "get-subscription-status",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(status.result).toBeTuple({
      "is-active": Cl.bool(true),
      "days-remaining": expect.anything(),
      "current-discount": Cl.uint(0),
    });
  });

  it("is-payment-due returns false for active subscriber", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(100000000)],
      deployer
    );
    simnet.callPublicFn(
      "billing",
      "subscribe-and-pay",
      [
        Cl.uint(1),
        Cl.contractPrincipal(deployer, "data-tracking"),
        Cl.uint(0),
      ],
      wallet1
    );

    const result = simnet.callReadOnlyFn(
      "billing",
      "is-payment-due",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeBool(false);
  });
});
