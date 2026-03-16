import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;

function setupSellerWithData() {
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
}

describe("listing lifecycle", () => {
  it("create listing returns listing id", () => {
    setupSellerWithData();
    const { result } = simnet.callPublicFn(
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
    expect(result).toBeOk(Cl.uint(1));
  });

  it("created listing is active", () => {
    setupSellerWithData();
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
      "is-listing-active",
      [Cl.uint(1)],
      deployer
    );
    expect(result.result).toBeBool(true);
  });

  it("cancelled listing is not active", () => {
    setupSellerWithData();
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
      "is-listing-active",
      [Cl.uint(1)],
      deployer
    );
    expect(result.result).toBeBool(false);
  });

  it("non-seller cannot cancel listing", () => {
    setupSellerWithData();
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
    const { result } = simnet.callPublicFn(
      "marketplace",
      "cancel-listing",
      [Cl.uint(1)],
      wallet2
    );
    expect(result).toBeErr(Cl.uint(304));
  });

  it("nonexistent listing returns inactive", () => {
    const result = simnet.callReadOnlyFn(
      "marketplace",
      "is-listing-active",
      [Cl.uint(999)],
      deployer
    );
    expect(result.result).toBeBool(false);
  });

  it("get-listing returns none for missing id", () => {
    const result = simnet.callReadOnlyFn(
      "marketplace",
      "get-listing",
      [Cl.uint(999)],
      deployer
    );
    expect(result.result).toBeNone();
  });
});
