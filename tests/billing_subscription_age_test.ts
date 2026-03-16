import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("subscription age tracking", () => {
  it("age is zero for non-subscriber", () => {
    const result = simnet.callReadOnlyFn(
      "billing",
      "get-subscription-age",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeUint(0);
  });

  it("age increases with blocks after subscription", () => {
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
    simnet.mineEmptyBlocks(20);

    const result = simnet.callReadOnlyFn(
      "billing",
      "get-subscription-age",
      [Cl.principal(wallet1)],
      wallet1
    );
    const age = Number((result.result as any).value ?? 0);
    expect(age).toBeGreaterThan(10);
  });

  it("subscription plan id is correct after subscribe", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(2), Cl.uint(2000), Cl.uint(1000), Cl.uint(350000000)],
      deployer
    );
    simnet.callPublicFn(
      "billing",
      "subscribe-and-pay",
      [
        Cl.uint(2),
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
    expect(result.result).toBeSome(Cl.uint(2));
  });
});
