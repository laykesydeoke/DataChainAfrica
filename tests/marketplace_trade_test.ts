import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;

function setupTrade() {
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
}

describe("marketplace trade flows", () => {
  it("complete purchase succeeds", () => {
    setupTrade();
    const { result } = simnet.callPublicFn(
      "marketplace",
      "purchase-listing",
      [Cl.uint(1), Cl.contractPrincipal(deployer, "data-tracking")],
      wallet2
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("listing marked inactive after purchase", () => {
    setupTrade();
    simnet.callPublicFn(
      "marketplace",
      "purchase-listing",
      [Cl.uint(1), Cl.contractPrincipal(deployer, "data-tracking")],
      wallet2
    );
    const result = simnet.callReadOnlyFn(
      "marketplace",
      "is-listing-active",
      [Cl.uint(1)],
      deployer
    );
    expect(result.result).toBeBool(false);
  });

  it("total trades increments after purchase", () => {
    setupTrade();
    simnet.callPublicFn(
      "marketplace",
      "purchase-listing",
      [Cl.uint(1), Cl.contractPrincipal(deployer, "data-tracking")],
      wallet2
    );
    const stats = simnet.callReadOnlyFn(
      "marketplace",
      "get-platform-stats",
      [],
      deployer
    );
    expect(stats.result).toBeTuple({
      "total-volume": Cl.uint(300),
      "total-trades": Cl.uint(1),
      "total-listings": Cl.uint(1),
    });
  });

  it("self-purchase is rejected", () => {
    setupTrade();
    const { result } = simnet.callPublicFn(
      "marketplace",
      "purchase-listing",
      [Cl.uint(1), Cl.contractPrincipal(deployer, "data-tracking")],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(308));
  });

  it("buying from same listing twice fails", () => {
    setupTrade();
    simnet.callPublicFn(
      "marketplace",
      "purchase-listing",
      [Cl.uint(1), Cl.contractPrincipal(deployer, "data-tracking")],
      wallet2
    );
    const { result } = simnet.callPublicFn(
      "marketplace",
      "purchase-listing",
      [Cl.uint(1), Cl.contractPrincipal(deployer, "data-tracking")],
      wallet2
    );
    expect(result).toBeErr(Cl.uint(303));
  });
});
