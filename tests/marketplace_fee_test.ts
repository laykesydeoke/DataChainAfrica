import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;

describe("marketplace fee configuration", () => {
  it("owner can set platform fee", () => {
    const result = simnet.callPublicFn(
      "marketplace",
      "set-platform-fee",
      [Cl.uint(3)],
      deployer
    );
    expect(result.result).toBeOk(expect.anything());
  });

  it("fee above max is rejected", () => {
    const result = simnet.callPublicFn(
      "marketplace",
      "set-platform-fee",
      [Cl.uint(15)],
      deployer
    );
    expect(result.result).toBeErr(expect.anything());
  });

  it("non-owner cannot set fee", () => {
    const result = simnet.callPublicFn(
      "marketplace",
      "set-platform-fee",
      [Cl.uint(2)],
      wallet1
    );
    expect(result.result).toBeErr(expect.anything());
  });

  it("fee applies to purchase price", () => {
    simnet.callPublicFn(
      "marketplace",
      "set-platform-fee",
      [Cl.uint(2)],
      deployer
    );
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
    const result = simnet.callPublicFn(
      "marketplace",
      "purchase-listing",
      [Cl.uint(1), Cl.contractPrincipal(deployer, "data-tracking")],
      wallet2
    );
    expect(result.result).toBeOk(expect.anything());

    const sellerRevenue = simnet.callReadOnlyFn(
      "marketplace",
      "get-seller-revenue",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(sellerRevenue.result).toBeUint(980000);
  });
});
