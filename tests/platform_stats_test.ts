import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;

describe("platform stats aggregation", () => {
  it("platform stats are zero initially", () => {
    const result = simnet.callReadOnlyFn(
      "marketplace",
      "get-platform-stats",
      [],
      deployer
    );
    expect(result.result).toBeTuple({
      "total-volume": Cl.uint(0),
      "total-trades": Cl.uint(0),
      "total-listings": Cl.uint(0),
    });
  });

  it("total listings grows with create-listing calls", () => {
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
      wallet2
    );

    const result = simnet.callReadOnlyFn(
      "marketplace",
      "get-platform-stats",
      [],
      deployer
    );
    const stats = result.result as any;
    const listings = Number(stats.data?.["total-listings"]?.value ?? 0);
    expect(listings).toBe(2);
  });
});
