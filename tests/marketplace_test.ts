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
      [Cl.uint(100), Cl.uint(5000000), Cl.uint(500),
        Cl.contractPrincipal(deployer, "data-tracking")],
      wallet1
    );

    const { result } = simnet.callPublicFn(
      "marketplace", "cancel-listing", [Cl.uint(1)], wallet1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("prevents non-seller from cancelling", () => {
    setupUserWithData();
    simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [Cl.uint(100), Cl.uint(5000000), Cl.uint(500),
        Cl.contractPrincipal(deployer, "data-tracking")],
      wallet1
    );

    const { result } = simnet.callPublicFn(
      "marketplace", "cancel-listing", [Cl.uint(1)], wallet2
    );
    expect(result).toBeErr(Cl.uint(304));
  });

  it("allows buyer to purchase listing", () => {
    setupUserWithData();
    simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [Cl.uint(100), Cl.uint(5000000), Cl.uint(500),
        Cl.contractPrincipal(deployer, "data-tracking")],
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
      [Cl.uint(100), Cl.uint(5000000), Cl.uint(500),
        Cl.contractPrincipal(deployer, "data-tracking")],
      wallet1
    );
    simnet.callPublicFn("marketplace", "cancel-listing", [Cl.uint(1)], wallet1);

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
      "marketplace", "get-listing-count", [], wallet1
    );
    expect(result.result).toBeUint(0);
  });

  it("checks listing active status for nonexistent", () => {
    const result = simnet.callReadOnlyFn(
      "marketplace", "is-listing-active", [Cl.uint(999)], wallet1
    );
    expect(result.result).toBeBool(false);
  });

  it("starts unpaused", () => {
    const result = simnet.callReadOnlyFn(
      "marketplace", "get-paused", [], deployer
    );
    expect(result.result).toBeBool(false);
  });

  it("owner can pause marketplace", () => {
    simnet.callPublicFn("marketplace", "set-paused", [Cl.bool(true)], deployer);
    const paused = simnet.callReadOnlyFn("marketplace", "get-paused", [], deployer);
    expect(paused.result).toBeBool(true);
    simnet.callPublicFn("marketplace", "set-paused", [Cl.bool(false)], deployer);
  });

  it("create-listing fails when paused", () => {
    setupUserWithData();
    simnet.callPublicFn("marketplace", "set-paused", [Cl.bool(true)], deployer);

    const { result } = simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [Cl.uint(100), Cl.uint(5000000), Cl.uint(500),
        Cl.contractPrincipal(deployer, "data-tracking")],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(306));
    simnet.callPublicFn("marketplace", "set-paused", [Cl.bool(false)], deployer);
  });

  it("prevents self-purchase of own listing", () => {
    setupUserWithData();
    simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [Cl.uint(100), Cl.uint(5000000), Cl.uint(500),
        Cl.contractPrincipal(deployer, "data-tracking")],
      wallet1
    );

    const { result } = simnet.callPublicFn(
      "marketplace",
      "purchase-listing",
      [Cl.uint(1), Cl.contractPrincipal(deployer, "data-tracking")],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(308));
  });

  it("owner can set platform fee", () => {
    const { result } = simnet.callPublicFn(
      "marketplace", "set-platform-fee", [Cl.uint(3)], deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    const fee = simnet.callReadOnlyFn("marketplace", "get-platform-fee", [], deployer);
    expect(fee.result).toBeUint(3);

    simnet.callPublicFn("marketplace", "set-platform-fee", [Cl.uint(2)], deployer);
  });

  it("rejects fee above 10 percent", () => {
    const { result } = simnet.callPublicFn(
      "marketplace", "set-platform-fee", [Cl.uint(11)], deployer
    );
    expect(result).toBeErr(Cl.uint(307));
  });

  it("returns platform stats tuple", () => {
    const result = simnet.callReadOnlyFn(
      "marketplace", "get-platform-stats", [], deployer
    );
    expect(result.result).toBeTuple({
      "total-volume": Cl.uint(0),
      "total-trades": Cl.uint(0),
      "total-listings": Cl.uint(0),
    });
  });

  it("platform stats update after purchase", () => {
    setupUserWithData();
    simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [Cl.uint(100), Cl.uint(5000000), Cl.uint(500),
        Cl.contractPrincipal(deployer, "data-tracking")],
      wallet1
    );

    simnet.callPublicFn(
      "marketplace",
      "purchase-listing",
      [Cl.uint(1), Cl.contractPrincipal(deployer, "data-tracking")],
      wallet2
    );

    const stats = simnet.callReadOnlyFn(
      "marketplace", "get-platform-stats", [], deployer
    );
    expect(stats.result).toBeTuple({
      "total-volume": Cl.uint(5000000),
      "total-trades": Cl.uint(1),
      "total-listings": Cl.uint(1),
    });
  });
});
