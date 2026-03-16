import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("subscription plan queries", () => {
  it("get-subscription-plan returns current plan id", () => {
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
      "get-subscription-plan",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeSome(Cl.uint(1));
  });

  it("get-subscription-plan returns none for non-subscriber", () => {
    const result = simnet.callReadOnlyFn(
      "billing",
      "get-subscription-plan",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeNone();
  });

  it("get-user-discount returns zero without promo", () => {
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
      "get-user-discount",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeUint(0);
  });
});
