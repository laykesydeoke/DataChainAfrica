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
      Cl.uint(200),
      Cl.uint(100),
      Cl.contractPrincipal(deployer, "data-tracking"),
    ],
    wallet1
  );
}

describe("extend listing duration", () => {
  it("seller can extend active listing", () => {
    setupListing();
    const { result } = simnet.callPublicFn(
      "marketplace",
      "extend-listing-duration",
      [Cl.uint(1), Cl.uint(200)],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("non-seller cannot extend listing", () => {
    setupListing();
    const { result } = simnet.callPublicFn(
      "marketplace",
      "extend-listing-duration",
      [Cl.uint(1), Cl.uint(200)],
      wallet2
    );
    expect(result).toBeErr(Cl.uint(304));
  });

  it("cannot extend nonexistent listing", () => {
    const { result } = simnet.callPublicFn(
      "marketplace",
      "extend-listing-duration",
      [Cl.uint(999), Cl.uint(200)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(301));
  });

  it("cannot extend cancelled listing", () => {
    setupListing();
    simnet.callPublicFn(
      "marketplace",
      "cancel-listing",
      [Cl.uint(1)],
      wallet1
    );
    const { result } = simnet.callPublicFn(
      "marketplace",
      "extend-listing-duration",
      [Cl.uint(1), Cl.uint(200)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(303));
  });

  it("zero extra blocks rejected", () => {
    setupListing();
    const { result } = simnet.callPublicFn(
      "marketplace",
      "extend-listing-duration",
      [Cl.uint(1), Cl.uint(0)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(305));
  });

  it("extended listing remains active", () => {
    setupListing();
    simnet.callPublicFn(
      "marketplace",
      "extend-listing-duration",
      [Cl.uint(1), Cl.uint(1000)],
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
});
