import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;

describe("marketplace listing extension", () => {
  it("seller can extend their listing duration", () => {
    simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [Cl.uint(500), Cl.uint(1000000), Cl.uint(100)],
      wallet1
    );

    const result = simnet.callPublicFn(
      "marketplace",
      "extend-listing-duration",
      [Cl.uint(1), Cl.uint(50)],
      wallet1
    );
    expect(result.result).toBeOk(expect.anything());
  });

  it("non-seller cannot extend listing", () => {
    simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [Cl.uint(500), Cl.uint(1000000), Cl.uint(100)],
      wallet1
    );

    const result = simnet.callPublicFn(
      "marketplace",
      "extend-listing-duration",
      [Cl.uint(1), Cl.uint(50)],
      wallet2
    );
    expect(result.result).toBeErr(expect.anything());
  });

  it("extending cancelled listing fails", () => {
    simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [Cl.uint(500), Cl.uint(1000000), Cl.uint(100)],
      wallet1
    );
    simnet.callPublicFn(
      "marketplace",
      "cancel-listing",
      [Cl.uint(1)],
      wallet1
    );

    const result = simnet.callPublicFn(
      "marketplace",
      "extend-listing-duration",
      [Cl.uint(1), Cl.uint(50)],
      wallet1
    );
    expect(result.result).toBeErr(expect.anything());
  });
});
