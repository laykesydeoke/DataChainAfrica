import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;

describe("marketplace platform stats", () => {
  it("initial listing count is zero", () => {
    const result = simnet.callReadOnlyFn(
      "marketplace",
      "get-listing-count",
      [],
      deployer
    );
    expect(result.result).toBeUint(0);
  });

  it("listing count increments after create", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(1000), Cl.uint(144), Cl.uint(500)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "subscribe-to-plan",
      [Cl.uint(1), Cl.bool(false)],
      wallet1
    );
    simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [
        Cl.uint(100),
        Cl.uint(200),
        Cl.uint(500),
        Cl.contractPrincipal(deployer, "data-tracking"),
      ],
      wallet1
    );

    const result = simnet.callReadOnlyFn(
      "marketplace",
      "get-listing-count",
      [],
      deployer
    );
    expect(result.result).toBeUint(1);
  });

  it("active-listings in user-sales increments after create", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(1000), Cl.uint(144), Cl.uint(500)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "subscribe-to-plan",
      [Cl.uint(1), Cl.bool(false)],
      wallet1
    );
    simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [
        Cl.uint(100),
        Cl.uint(200),
        Cl.uint(500),
        Cl.contractPrincipal(deployer, "data-tracking"),
      ],
      wallet1
    );

    const result = simnet.callReadOnlyFn(
      "marketplace",
      "get-user-active-listings",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeUint(1);
  });

  it("active-listings decrements after cancel", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(1000), Cl.uint(144), Cl.uint(500)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "subscribe-to-plan",
      [Cl.uint(1), Cl.bool(false)],
      wallet1
    );
    simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [
        Cl.uint(100),
        Cl.uint(200),
        Cl.uint(500),
        Cl.contractPrincipal(deployer, "data-tracking"),
      ],
      wallet1
    );
    simnet.callPublicFn("marketplace", "cancel-listing", [Cl.uint(1)], wallet1);

    const result = simnet.callReadOnlyFn(
      "marketplace",
      "get-user-active-listings",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeUint(0);
  });

  it("total-sales increments after completed purchase", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(1000), Cl.uint(144), Cl.uint(500)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "subscribe-to-plan",
      [Cl.uint(1), Cl.bool(false)],
      wallet1
    );
    simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [
        Cl.uint(100),
        Cl.uint(300),
        Cl.uint(500),
        Cl.contractPrincipal(deployer, "data-tracking"),
      ],
      wallet1
    );
    simnet.callPublicFn(
      "marketplace",
      "purchase-listing",
      [Cl.uint(1), Cl.contractPrincipal(deployer, "data-tracking")],
      wallet2
    );

    const result = simnet.callReadOnlyFn(
      "marketplace",
      "get-user-sales",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeSome(
      expect.objectContaining({ type: expect.any(Number) })
    );
  });
});
