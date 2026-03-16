import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;

function setupListing() {
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

describe("update listing price", () => {
  it("seller can update listing price", () => {
    setupListing();
    const { result } = simnet.callPublicFn(
      "marketplace",
      "update-listing-price",
      [Cl.uint(1), Cl.uint(400)],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("non-seller cannot update price", () => {
    setupListing();
    const { result } = simnet.callPublicFn(
      "marketplace",
      "update-listing-price",
      [Cl.uint(1), Cl.uint(400)],
      wallet2
    );
    expect(result).toBeErr(Cl.uint(304));
  });

  it("cannot update price of nonexistent listing", () => {
    const { result } = simnet.callPublicFn(
      "marketplace",
      "update-listing-price",
      [Cl.uint(999), Cl.uint(400)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(301));
  });

  it("cannot update price of cancelled listing", () => {
    setupListing();
    simnet.callPublicFn(
      "marketplace",
      "cancel-listing",
      [Cl.uint(1)],
      wallet1
    );
    const { result } = simnet.callPublicFn(
      "marketplace",
      "update-listing-price",
      [Cl.uint(1), Cl.uint(400)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(303));
  });

  it("zero price is rejected", () => {
    setupListing();
    const { result } = simnet.callPublicFn(
      "marketplace",
      "update-listing-price",
      [Cl.uint(1), Cl.uint(0)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(305));
  });
});
