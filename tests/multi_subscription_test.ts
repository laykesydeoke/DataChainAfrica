import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;

describe("multiple subscriptions tracking", () => {
  it("total subscribers counts unique subscribers", () => {
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

    const result = simnet.callReadOnlyFn(
      "billing",
      "get-total-subscribers",
      [],
      deployer
    );
    expect(result.result).toBeUint(2);
  });

  it("per-user payment count tracks independently", () => {
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
    expect(count2.result).toBeUint(0);
  });
});
