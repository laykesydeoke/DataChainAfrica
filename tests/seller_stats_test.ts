import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;

describe("seller statistics", () => {
  it("seller stats show after creating listing", () => {
    simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [Cl.uint(500), Cl.uint(1000000), Cl.uint(100)],
      wallet1
    );

    const result = simnet.callReadOnlyFn(
      "marketplace",
      "get-seller-stats",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeTuple({
      "total-sales": Cl.uint(0),
      "total-data-sold": Cl.uint(0),
      "active-listings": Cl.uint(1),
    });
  });

  it("seller revenue updates after sale", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(5000), Cl.uint(1000), Cl.uint(500)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "subscribe-to-plan",
      [Cl.uint(1), Cl.bool(false)],
      wallet2
    );
    simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [Cl.uint(500), Cl.uint(1000000), Cl.uint(100)],
      wallet1
    );
    simnet.callPublicFn(
      "marketplace",
      "purchase-listing",
      [
        Cl.uint(1),
        Cl.contractPrincipal(deployer, "data-tracking"),
      ],
      wallet2
    );

    const result = simnet.callReadOnlyFn(
      "marketplace",
      "get-seller-revenue",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeUint(980000);
  });

  it("get-seller-stats returns zero for new user", () => {
    const result = simnet.callReadOnlyFn(
      "marketplace",
      "get-seller-stats",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeTuple({
      "total-sales": Cl.uint(0),
      "total-data-sold": Cl.uint(0),
      "active-listings": Cl.uint(0),
    });
  });
});
