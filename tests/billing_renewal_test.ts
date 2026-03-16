import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("billing renewal flow", () => {
  it("renewal after cancel succeeds within grace", () => {
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
    simnet.callPublicFn("billing", "cancel-subscription", [], wallet1);

    const { result } = simnet.callPublicFn(
      "billing",
      "process-renewal-payment",
      [Cl.contractPrincipal(deployer, "data-tracking")],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("renewal updates payment counter", () => {
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
    simnet.callPublicFn("billing", "cancel-subscription", [], wallet1);
    simnet.callPublicFn(
      "billing",
      "process-renewal-payment",
      [Cl.contractPrincipal(deployer, "data-tracking")],
      wallet1
    );

    const result = simnet.callReadOnlyFn(
      "billing",
      "get-total-payments",
      [],
      deployer
    );
    expect(result.result).toBeUint(2);
  });

  it("renewal payment active after renew", () => {
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
    simnet.callPublicFn("billing", "cancel-subscription", [], wallet1);
    simnet.callPublicFn(
      "billing",
      "process-renewal-payment",
      [Cl.contractPrincipal(deployer, "data-tracking")],
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

  it("user payment count increments after renewal", () => {
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
    simnet.callPublicFn("billing", "cancel-subscription", [], wallet1);
    simnet.callPublicFn(
      "billing",
      "process-renewal-payment",
      [Cl.contractPrincipal(deployer, "data-tracking")],
      wallet1
    );

    const result = simnet.callReadOnlyFn(
      "billing",
      "get-user-payment-count",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeUint(2);
  });
});
