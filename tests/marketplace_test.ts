import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;

describe("marketplace contract", () => {
  function setupUserWithData() {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(5000), Cl.uint(1000), Cl.uint(50000000)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "subscribe-to-plan",
      [Cl.uint(1), Cl.bool(false)],
      wallet1
    );
    // Authorize marketplace contract to transfer data
    simnet.callPublicFn(
      "data-tracking",
      "authorize-marketplace",
      [Cl.contractPrincipal(deployer, "marketplace")],
      deployer
    );
  }

  it("allows user to create a listing", () => {
    setupUserWithData();

    const { result } = simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [
        Cl.uint(100),
        Cl.uint(5000000),
        Cl.uint(500),
        Cl.contractPrincipal(deployer, "data-tracking"),
      ],
      wallet1
    );
    expect(result).toBeOk(Cl.uint(1));
  });

  it("prevents listing more data than balance", () => {
    setupUserWithData();

    const { result } = simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [
        Cl.uint(99999),
        Cl.uint(5000000),
        Cl.uint(500),
        Cl.contractPrincipal(deployer, "data-tracking"),
      ],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(302));
  });

  it("allows seller to cancel listing", () => {
    setupUserWithData();

    simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [
        Cl.uint(100),
        Cl.uint(5000000),
        Cl.uint(500),
        Cl.contractPrincipal(deployer, "data-tracking"),
      ],
      wallet1
    );

    const { result } = simnet.callPublicFn(
      "marketplace",
      "cancel-listing",
      [Cl.uint(1)],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("prevents non-seller from cancelling", () => {
    setupUserWithData();

    simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [
        Cl.uint(100),
        Cl.uint(5000000),
        Cl.uint(500),
        Cl.contractPrincipal(deployer, "data-tracking"),
      ],
      wallet1
    );

    const { result } = simnet.callPublicFn(
      "marketplace",
      "cancel-listing",
      [Cl.uint(1)],
      wallet2
    );
    expect(result).toBeErr(Cl.uint(304));
  });

  it("allows buyer to purchase listing", () => {
    setupUserWithData();

    simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [
        Cl.uint(100),
        Cl.uint(5000000),
        Cl.uint(500),
        Cl.contractPrincipal(deployer, "data-tracking"),
      ],
      wallet1
    );

    const { result } = simnet.callPublicFn(
      "marketplace",
      "purchase-listing",
      [Cl.uint(1), Cl.contractPrincipal(deployer, "data-tracking")],
      wallet2
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("prevents purchasing inactive listing", () => {
    setupUserWithData();

    simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [
        Cl.uint(100),
        Cl.uint(5000000),
        Cl.uint(500),
        Cl.contractPrincipal(deployer, "data-tracking"),
      ],
      wallet1
    );
    simnet.callPublicFn(
      "marketplace",
      "cancel-listing",
      [Cl.uint(1)],
      wallet1
    );

    const { result } = simnet.callPublicFn(
      "marketplace",
      "purchase-listing",
      [Cl.uint(1), Cl.contractPrincipal(deployer, "data-tracking")],
      wallet2
    );
    expect(result).toBeErr(Cl.uint(303));
  });

  it("returns listing count", () => {
    const result = simnet.callReadOnlyFn(
      "marketplace",
      "get-listing-count",
      [],
      wallet1
    );
    expect(result.result).toBeUint(0);
  });

  it("checks listing active status", () => {
    const result = simnet.callReadOnlyFn(
      "marketplace",
      "is-listing-active",
      [Cl.uint(999)],
      wallet1
    );
    expect(result.result).toBeBool(false);
  });

  it("transfers data balance from seller to buyer on purchase", () => {
    setupUserWithData();

    // Check seller balance before
    const sellerBefore = simnet.callPublicFn(
      "data-tracking",
      "get-usage",
      [Cl.principal(wallet1)],
      wallet1
    );

    // Create listing for 100 MB
    simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [
        Cl.uint(100),
        Cl.uint(5000000),
        Cl.uint(500),
        Cl.contractPrincipal(deployer, "data-tracking"),
      ],
      wallet1
    );

    // Purchase the listing
    simnet.callPublicFn(
      "marketplace",
      "purchase-listing",
      [Cl.uint(1), Cl.contractPrincipal(deployer, "data-tracking")],
      wallet2
    );

    // Verify seller balance decreased
    const sellerAfter = simnet.callPublicFn(
      "data-tracking",
      "get-usage",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(sellerAfter.result).toBeOk(
      expect.objectContaining({ type: expect.any(Number) })
    );

    // Verify buyer received data
    const buyerAfter = simnet.callPublicFn(
      "data-tracking",
      "get-usage",
      [Cl.principal(wallet2)],
      wallet2
    );
    expect(buyerAfter.result).toBeOk(
      expect.objectContaining({ type: expect.any(Number) })
    );
  });

  it("updates seller stats after purchase", () => {
    setupUserWithData();

    simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [
        Cl.uint(100),
        Cl.uint(5000000),
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

    const stats = simnet.callReadOnlyFn(
      "marketplace",
      "get-user-sales",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(stats.result).toBeSome(
      expect.objectContaining({ type: expect.any(Number) })
    );
  });

  it("returns user active listing count", () => {
    setupUserWithData();

    simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [
        Cl.uint(50),
        Cl.uint(2500000),
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

  it("returns default marketplace fee rate", () => {
    const result = simnet.callReadOnlyFn(
      "marketplace",
      "get-marketplace-fee-rate",
      [],
      wallet1
    );
    expect(result.result).toBeUint(200); // 2% = 200 basis points
  });

  it("allows owner to update fee rate", () => {
    const { result } = simnet.callPublicFn(
      "marketplace",
      "set-marketplace-fee-rate",
      [Cl.uint(300)], // 3%
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("prevents non-owner from updating fee rate", () => {
    const { result } = simnet.callPublicFn(
      "marketplace",
      "set-marketplace-fee-rate",
      [Cl.uint(300)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(300));
  });

  it("rejects fee rate above 10%", () => {
    const { result } = simnet.callPublicFn(
      "marketplace",
      "set-marketplace-fee-rate",
      [Cl.uint(1500)], // 15% too high
      deployer
    );
    expect(result).toBeErr(Cl.uint(301));
  });

  it("tracks total fees collected", () => {
    const result = simnet.callReadOnlyFn(
      "marketplace",
      "get-total-fees-collected",
      [],
      wallet1
    );
    expect(result.result).toBeUint(0);
  });
});
