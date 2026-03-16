import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;

describe("marketplace listing price update", () => {
  it("seller can update listing price", () => {
    simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [Cl.uint(500), Cl.uint(1000000), Cl.uint(100)],
      wallet1
    );

    const result = simnet.callPublicFn(
      "marketplace",
      "update-listing-price",
      [Cl.uint(1), Cl.uint(750000)],
      wallet1
    );
    expect(result.result).toBeOk(expect.anything());
  });

  it("non-seller cannot update listing price", () => {
    simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [Cl.uint(500), Cl.uint(1000000), Cl.uint(100)],
      wallet1
    );

    const result = simnet.callPublicFn(
      "marketplace",
      "update-listing-price",
      [Cl.uint(1), Cl.uint(750000)],
      wallet2
    );
    expect(result.result).toBeErr(expect.anything());
  });

  it("listing with zero price is rejected", () => {
    simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [Cl.uint(500), Cl.uint(1000000), Cl.uint(100)],
      wallet1
    );

    const result = simnet.callPublicFn(
      "marketplace",
      "update-listing-price",
      [Cl.uint(1), Cl.uint(0)],
      wallet1
    );
    expect(result.result).toBeErr(expect.anything());
  });
});
