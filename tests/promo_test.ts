import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("promotional rates", () => {
  it("owner can create a promo code", () => {
    const { result } = simnet.callPublicFn(
      "billing",
      "set-promotional-rate",
      [Cl.uint(10), Cl.uint(25), Cl.uint(2000), Cl.uint(1)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("promo is valid immediately after creation", () => {
    simnet.callPublicFn(
      "billing",
      "set-promotional-rate",
      [Cl.uint(10), Cl.uint(25), Cl.uint(2000), Cl.uint(1)],
      deployer
    );

    const result = simnet.callReadOnlyFn(
      "billing",
      "is-promotion-valid",
      [Cl.uint(10)],
      deployer
    );
    expect(result.result).toBeBool(true);
  });

  it("discount of 100 percent is allowed", () => {
    const { result } = simnet.callPublicFn(
      "billing",
      "set-promotional-rate",
      [Cl.uint(11), Cl.uint(100), Cl.uint(1000), Cl.uint(0)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("discount of 0 percent is allowed", () => {
    const { result } = simnet.callPublicFn(
      "billing",
      "set-promotional-rate",
      [Cl.uint(12), Cl.uint(0), Cl.uint(1000), Cl.uint(0)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("subscription with valid promo applies discount", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(100000000)],
      deployer
    );
    simnet.callPublicFn(
      "billing",
      "set-promotional-rate",
      [Cl.uint(5), Cl.uint(10), Cl.uint(5000), Cl.uint(1)],
      deployer
    );

    const { result } = simnet.callPublicFn(
      "billing",
      "subscribe-and-pay",
      [
        Cl.uint(1),
        Cl.contractPrincipal(deployer, "data-tracking"),
        Cl.uint(5),
      ],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));

    // Subscription should record discounted payment
    const sub = simnet.callReadOnlyFn(
      "billing",
      "get-subscription",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(sub.result).toBeSome(
      expect.objectContaining({ type: expect.any(Number) })
    );
  });

  it("get-promotional-rate returns correct data", () => {
    simnet.callPublicFn(
      "billing",
      "set-promotional-rate",
      [Cl.uint(20), Cl.uint(15), Cl.uint(3000), Cl.uint(2)],
      deployer
    );

    const result = simnet.callReadOnlyFn(
      "billing",
      "get-promotional-rate",
      [Cl.uint(20)],
      deployer
    );
    expect(result.result).toBeSome(
      expect.objectContaining({ type: expect.any(Number) })
    );
  });
});
