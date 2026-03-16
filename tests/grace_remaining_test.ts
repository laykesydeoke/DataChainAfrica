import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("grace period remaining", () => {
  it("grace period remaining is zero before cancellation", () => {
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
      "get-grace-period-remaining",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeUint(0);
  });

  it("grace period remaining is positive after cancel", () => {
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

    const result = simnet.callReadOnlyFn(
      "billing",
      "get-grace-period-remaining",
      [Cl.principal(wallet1)],
      wallet1
    );
    const remaining = Number((result.result as any).value ?? 0);
    expect(remaining).toBeGreaterThan(0);
  });

  it("non-subscriber grace period is zero", () => {
    const result = simnet.callReadOnlyFn(
      "billing",
      "get-grace-period-remaining",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeUint(0);
  });
});
