import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("billing contract", () => {
  it("allows owner to set promotional rate", () => {
    const { result } = simnet.callPublicFn(
      "billing",
      "set-promotional-rate",
      [Cl.uint(1), Cl.uint(20), Cl.uint(1000), Cl.uint(3)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("prevents non-owner from setting promos", () => {
    const { result } = simnet.callPublicFn(
      "billing",
      "set-promotional-rate",
      [Cl.uint(1), Cl.uint(20), Cl.uint(1000), Cl.uint(3)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(200));
  });

  it("rejects discount above 100", () => {
    const { result } = simnet.callPublicFn(
      "billing",
      "set-promotional-rate",
      [Cl.uint(1), Cl.uint(101), Cl.uint(1000), Cl.uint(3)],
      deployer
    );
    expect(result).toBeErr(Cl.uint(206));
  });

  it("subscribes and pays with tracking contract", () => {
    // First set up a plan in data-tracking
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(50000000)],
      deployer
    );

    const { result } = simnet.callPublicFn(
      "billing",
      "subscribe-and-pay",
      [
        Cl.uint(1),
        Cl.contractPrincipal(deployer, "data-tracking"),
        Cl.uint(0),
      ],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("records subscription after payment", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(50000000)],
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
      "get-subscription",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeSome(
      expect.objectContaining({
        type: expect.any(Number),
      })
    );
  });

  it("returns subscription status safely", () => {
    const result = simnet.callReadOnlyFn(
      "billing",
      "get-subscription-status",
      [Cl.principal(wallet1)],
      wallet1
    );
    // Should not underflow for non-existent user
    expect(result.result).toBeTuple({
      "is-active": Cl.bool(false),
      "days-remaining": Cl.uint(0),
      "current-discount": Cl.uint(0),
    });
  });

  it("returns grace period", () => {
    const result = simnet.callReadOnlyFn(
      "billing",
      "get-grace-period",
      [],
      wallet1
    );
    expect(result.result).toBeUint(144);
  });

  it("checks payment-due for non-subscriber", () => {
    const result = simnet.callReadOnlyFn(
      "billing",
      "is-payment-due",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeBool(false);
  });

  it("validates promotion check", () => {
    simnet.callPublicFn(
      "billing",
      "set-promotional-rate",
      [Cl.uint(1), Cl.uint(10), Cl.uint(5000), Cl.uint(1)],
      deployer
    );

    const result = simnet.callReadOnlyFn(
      "billing",
      "is-promotion-valid",
      [Cl.uint(1)],
      deployer
    );
    expect(result.result).toBeBool(true);
  });
});
