import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("marketplace contract coverage", () => {
  it("create listing with paused contract fails", () => {
    simnet.callPublicFn("marketplace", "set-paused", [Cl.bool(true)], deployer);

    const result = simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [Cl.uint(500), Cl.uint(1000000), Cl.uint(100)],
      wallet1
    );
    expect(result.result).toBeErr(expect.anything());

    simnet.callPublicFn("marketplace", "set-paused", [Cl.bool(false)], deployer);
  });

  it("get-listing returns none for non-existent listing", () => {
    const result = simnet.callReadOnlyFn(
      "marketplace",
      "get-listing",
      [Cl.uint(999)],
      deployer
    );
    expect(result.result).toBeNone();
  });

  it("listing counter is correct after creates", () => {
    simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [Cl.uint(100), Cl.uint(100000), Cl.uint(50)],
      wallet1
    );
    simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [Cl.uint(200), Cl.uint(200000), Cl.uint(50)],
      wallet1
    );
    simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [Cl.uint(300), Cl.uint(300000), Cl.uint(50)],
      wallet1
    );

    const result = simnet.callReadOnlyFn(
      "marketplace",
      "get-listing-count",
      [],
      deployer
    );
    expect(result.result).toBeUint(3);
  });
});
