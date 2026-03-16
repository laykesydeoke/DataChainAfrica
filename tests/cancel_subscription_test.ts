import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

function subscribe() {
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
}

describe("cancel subscription", () => {
  it("active subscriber can cancel", () => {
    subscribe();
    const { result } = simnet.callPublicFn(
      "billing",
      "cancel-subscription",
      [],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("cancelled subscription shows payment-status false", () => {
    subscribe();
    simnet.callPublicFn("billing", "cancel-subscription", [], wallet1);
    const result = simnet.callReadOnlyFn(
      "billing",
      "is-payment-due",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeBool(true);
  });

  it("cannot cancel without subscription", () => {
    const { result } = simnet.callPublicFn(
      "billing",
      "cancel-subscription",
      [],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(204));
  });

  it("cannot cancel twice", () => {
    subscribe();
    simnet.callPublicFn("billing", "cancel-subscription", [], wallet1);
    const { result } = simnet.callPublicFn(
      "billing",
      "cancel-subscription",
      [],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(209));
  });

  it("subscription status is-active false after cancel", () => {
    subscribe();
    simnet.callPublicFn("billing", "cancel-subscription", [], wallet1);
    const result = simnet.callReadOnlyFn(
      "billing",
      "get-subscription-status",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeTuple({
      "is-active": Cl.bool(false),
      "days-remaining": expect.anything(),
      "current-discount": Cl.uint(0),
    });
  });
});
