import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;

describe("subscription status checks", () => {
  it("unsubscribed user shows inactive status", () => {
    const result = simnet.callReadOnlyFn(
      "billing",
      "get-subscription-status",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeTuple({
      "is-active": Cl.bool(false),
      "days-remaining": Cl.uint(0),
      "current-discount": Cl.uint(0),
    });
  });

  it("active subscriber shows is-active true", () => {
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
      "get-subscription-status",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeTuple({
      "is-active": Cl.bool(true),
      "days-remaining": expect.anything(),
      "current-discount": Cl.uint(0),
    });
  });

  it("is-payment-due false for new subscriber", () => {
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

  it("is-payment-due true for non-subscriber", () => {
    const result = simnet.callReadOnlyFn(
      "billing",
      "is-payment-due",
      [Cl.principal(wallet2)],
      wallet2
    );
    expect(result.result).toBeBool(true);
  });

  it("get-subscription returns none for unknown user", () => {
    const result = simnet.callReadOnlyFn(
      "billing",
      "get-subscription",
      [Cl.principal(wallet2)],
      wallet2
    );
    expect(result.result).toBeNone();
  });
});
