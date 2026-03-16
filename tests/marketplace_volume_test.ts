import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;
const wallet3 = simnet.getAccounts().get("wallet_3")!;

function fullTrade(
  seller: string,
  buyer: string,
  listingId: number,
  price: number
) {
  simnet.callPublicFn(
    "data-tracking",
    "set-data-plan",
    [Cl.uint(listingId), Cl.uint(5000), Cl.uint(1000), Cl.uint(500)],
    deployer
  );
  simnet.callPublicFn(
    "data-tracking",
    "subscribe-to-plan",
    [Cl.uint(listingId), Cl.bool(false)],
    seller
  );
  simnet.callPublicFn(
    "marketplace",
    "create-listing",
    [
      Cl.uint(100),
      Cl.uint(price),
      Cl.uint(500),
      Cl.contractPrincipal(deployer, "data-tracking"),
    ],
    seller
  );
  simnet.callPublicFn(
    "marketplace",
    "purchase-listing",
    [Cl.uint(listingId), Cl.contractPrincipal(deployer, "data-tracking")],
    buyer
  );
}

describe("marketplace volume tracking", () => {
  it("volume increments after trade", () => {
    fullTrade(wallet1, wallet2, 1, 500);
    const stats = simnet.callReadOnlyFn(
      "marketplace",
      "get-platform-stats",
      [],
      deployer
    );
    expect(stats.result).toBeTuple({
      "total-volume": Cl.uint(500),
      "total-trades": Cl.uint(1),
      "total-listings": Cl.uint(1),
    });
  });

  it("total trades increments for each purchase", () => {
    fullTrade(wallet1, wallet2, 1, 300);
    fullTrade(wallet1, wallet3, 2, 400);
    const stats = simnet.callReadOnlyFn(
      "marketplace",
      "get-platform-stats",
      [],
      deployer
    );
    expect(stats.result).toBeTuple({
      "total-volume": Cl.uint(700),
      "total-trades": Cl.uint(2),
      "total-listings": Cl.uint(2),
    });
  });

  it("buyer total-spent accumulates", () => {
    fullTrade(wallet1, wallet2, 1, 300);
    fullTrade(wallet1, wallet2, 2, 400);
    const stats = simnet.callReadOnlyFn(
      "marketplace",
      "get-buyer-stats",
      [Cl.principal(wallet2)],
      wallet2
    );
    expect(stats.result).toBeTuple({
      "total-purchases": Cl.uint(2),
      "total-data-bought": Cl.uint(200),
      "total-spent": Cl.uint(700),
    });
  });
});
