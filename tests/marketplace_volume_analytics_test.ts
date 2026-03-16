import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;

describe("marketplace volume analytics", () => {
  it("total volume grows with each purchase", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(5000), Cl.uint(1000), Cl.uint(100)],
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
      [Cl.uint(200), Cl.uint(2000000), Cl.uint(200)],
      wallet1
    );
    simnet.callPublicFn(
      "marketplace",
      "purchase-listing",
      [Cl.uint(1), Cl.contractPrincipal(deployer, "data-tracking")],
      wallet2
    );

    const stats = simnet.callReadOnlyFn(
      "marketplace",
      "get-platform-stats",
      [],
      deployer
    );
    const s = stats.result as any;
    const volume = Number(s.data?.["total-volume"]?.value ?? 0);
    expect(volume).toBeGreaterThan(0);
  });

  it("total listings counter includes all listings", () => {
    simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [Cl.uint(100), Cl.uint(500000), Cl.uint(50)],
      wallet1
    );
    simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [Cl.uint(200), Cl.uint(1000000), Cl.uint(50)],
      wallet2
    );

    const result = simnet.callReadOnlyFn(
      "marketplace",
      "get-listing-count",
      [],
      deployer
    );
    expect(result.result).toBeUint(2);
  });
});
