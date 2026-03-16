import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;

function setupSeller(plan = 1) {
  simnet.callPublicFn(
    "data-tracking",
    "set-data-plan",
    [Cl.uint(plan), Cl.uint(10000), Cl.uint(1000), Cl.uint(500)],
    deployer
  );
  simnet.callPublicFn(
    "data-tracking",
    "subscribe-to-plan",
    [Cl.uint(plan), Cl.bool(false)],
    wallet1
  );
}

describe("concurrent listings", () => {
  it("seller can have multiple active listings", () => {
    setupSeller();
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
    simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [
        Cl.uint(200),
        Cl.uint(300),
        Cl.uint(500),
        Cl.contractPrincipal(deployer, "data-tracking"),
      ],
      wallet1
    );

    const result = simnet.callReadOnlyFn(
      "marketplace",
      "get-user-active-listings",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeUint(2);
  });

  it("listing count is global across sellers", () => {
    setupSeller();
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(2), Cl.uint(10000), Cl.uint(1000), Cl.uint(500)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "subscribe-to-plan",
      [Cl.uint(2), Cl.bool(false)],
      wallet2
    );

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
    simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [
        Cl.uint(100),
        Cl.uint(150),
        Cl.uint(500),
        Cl.contractPrincipal(deployer, "data-tracking"),
      ],
      wallet2
    );

    const count = simnet.callReadOnlyFn(
      "marketplace",
      "get-listing-count",
      [],
      deployer
    );
    expect(count.result).toBeUint(2);
  });

  it("cancelling one listing does not affect another", () => {
    setupSeller();
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
    simnet.callPublicFn(
      "marketplace",
      "cancel-listing",
      [Cl.uint(1)],
      wallet1
    );

    const active2 = simnet.callReadOnlyFn(
      "marketplace",
      "is-listing-active",
      [Cl.uint(2)],
      deployer
    );
    expect(active2.result).toBeBool(true);
  });
});
