import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;

describe("marketplace summary", () => {
  it("marketplace summary returns zero stats initially", () => {
    const result = simnet.callReadOnlyFn(
      "marketplace",
      "get-marketplace-summary",
      [],
      deployer
    );
    expect(result.result).toBeTuple({
      "total-volume": Cl.uint(0),
      "total-trades": Cl.uint(0),
      "total-listings": Cl.uint(0),
      "active-listings": Cl.uint(0),
    });
  });

  it("listing count reflects in summary after create", () => {
    simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [Cl.uint(500), Cl.uint(1000000), Cl.uint(100)],
      wallet1
    );

    const result = simnet.callReadOnlyFn(
      "marketplace",
      "get-marketplace-summary",
      [],
      deployer
    );
    const summary = result.result as any;
    const activeListings = Number(summary.data?.["active-listings"]?.value ?? 0);
    expect(activeListings).toBe(1);
  });

  it("total trades increments after purchase", () => {
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
      [Cl.uint(1), Cl.contractPrincipal(deployer, "data-tracking")],
      wallet2
    );

    const result = simnet.callReadOnlyFn(
      "marketplace",
      "get-platform-stats",
      [],
      deployer
    );
    const stats = result.result as any;
    const trades = Number(stats.data?.["total-trades"]?.value ?? 0);
    expect(trades).toBe(1);
  });
});
