import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("marketplace self-purchase protection", () => {
  it("seller cannot buy their own listing", () => {
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
      [Cl.uint(500), Cl.uint(1000000), Cl.uint(100)],
      wallet1
    );

    const result = simnet.callPublicFn(
      "marketplace",
      "purchase-listing",
      [Cl.uint(1), Cl.contractPrincipal(deployer, "data-tracking")],
      wallet1
    );
    expect(result.result).toBeErr(expect.anything());
  });

  it("listing count increments on create", () => {
    simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [Cl.uint(500), Cl.uint(1000000), Cl.uint(100)],
      wallet1
    );

    const result = simnet.callReadOnlyFn(
      "marketplace",
      "get-listing-count",
      [],
      deployer
    );
    expect(result.result).toBeUint(1);
  });
});
