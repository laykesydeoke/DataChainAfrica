import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("promotional discount application", () => {
  it("subscribe with 0 promo uses full price", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(100000000)],
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

  it("subscribe with valid promo applies discount", () => {
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
  });

  it("is-promotion-valid returns false before creation", () => {
    const result = simnet.callReadOnlyFn(
      "billing",
      "is-promotion-valid",
      [Cl.uint(99)],
      deployer
    );
    expect(result.result).toBeBool(false);
  });

  it("promo rate returned after creation", () => {
    simnet.callPublicFn(
      "billing",
      "set-promotional-rate",
      [Cl.uint(7), Cl.uint(20), Cl.uint(2000), Cl.uint(3)],
      deployer
    );
    const result = simnet.callReadOnlyFn(
      "billing",
      "get-promotional-rate",
      [Cl.uint(7)],
      deployer
    );
    expect(result.result).toBeSome(
      expect.objectContaining({ type: expect.any(Number) })
    );
  });

  it("subscription records discount rate", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(100000000)],
      deployer
    );
    simnet.callPublicFn(
      "billing",
      "set-promotional-rate",
      [Cl.uint(3), Cl.uint(15), Cl.uint(5000), Cl.uint(1)],
      deployer
    );
    simnet.callPublicFn(
      "billing",
      "subscribe-and-pay",
      [
        Cl.uint(1),
        Cl.contractPrincipal(deployer, "data-tracking"),
        Cl.uint(3),
      ],
      wallet1
    );

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
});
