import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("payment history", () => {
  it("get-payment returns none for non-existent id", () => {
    const result = simnet.callReadOnlyFn(
      "billing",
      "get-payment",
      [Cl.uint(999)],
      deployer
    );
    expect(result.result).toBeNone();
  });

  it("get-payment-details returns default for non-existent id", () => {
    const result = simnet.callReadOnlyFn(
      "billing",
      "get-payment-details",
      [Cl.uint(999)],
      deployer
    );
    expect(result.result).toBeTuple({
      user: Cl.principal(deployer),
      amount: Cl.uint(0),
      timestamp: Cl.uint(0),
      "plan-id": Cl.uint(0),
      status: Cl.bool(false),
      "discount-applied": Cl.uint(0),
    });
  });

  it("payment history recorded after subscribe", () => {
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
      "get-payment",
      [Cl.uint(1)],
      deployer
    );
    expect(result.result).toBeSome(
      expect.objectContaining({ type: expect.any(Number) })
    );
  });

  it("get-user-payment returns none for wrong user", () => {
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
      "get-user-payment",
      [Cl.uint(1), Cl.principal(deployer)],
      deployer
    );
    expect(result.result).toBeNone();
  });

  it("get-user-payment returns some for correct user", () => {
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
      "get-user-payment",
      [Cl.uint(1), Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeSome(
      expect.objectContaining({ type: expect.any(Number) })
    );
  });
});
