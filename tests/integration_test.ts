import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;

describe("integration: full user journey", () => {
  it("user can subscribe via billing then list data for sale", () => {
    // Step 1: Owner creates plan
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(10), Cl.uint(5000), Cl.uint(1000), Cl.uint(50000000)],
      deployer
    );

    // Step 2: User subscribes and pays
    const subResult = simnet.callPublicFn(
      "billing",
      "subscribe-and-pay",
      [
        Cl.uint(10),
        Cl.contractPrincipal(deployer, "data-tracking"),
        Cl.uint(0),
      ],
      wallet1
    );
    expect(subResult.result).toBeOk(Cl.bool(true));

    // Step 3: User verifies their balance
    const usage = simnet.callPublicFn(
      "data-tracking",
      "get-usage",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(usage.result).toBeOk(
      expect.objectContaining({ type: expect.any(Number) })
    );

    // Step 4: User lists some data on marketplace
    const listResult = simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [
        Cl.uint(100),
        Cl.uint(3000000),
        Cl.uint(500),
        Cl.contractPrincipal(deployer, "data-tracking"),
      ],
      wallet1
    );
    expect(listResult.result).toBeOk(Cl.uint(1));

    // Step 5: Another user purchases
    const buyResult = simnet.callPublicFn(
      "marketplace",
      "purchase-listing",
      [Cl.uint(1), Cl.contractPrincipal(deployer, "data-tracking")],
      wallet2
    );
    expect(buyResult.result).toBeOk(Cl.bool(true));

    // Step 6: Platform stats updated
    const stats = simnet.callReadOnlyFn(
      "marketplace",
      "get-platform-stats",
      [],
      deployer
    );
    expect(stats.result).toBeTuple({
      "total-volume": Cl.uint(3000000),
      "total-trades": Cl.uint(1),
      "total-listings": Cl.uint(1),
    });
  });

  it("pausing all contracts blocks all user actions", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(10), Cl.uint(5000), Cl.uint(1000), Cl.uint(50000000)],
      deployer
    );

    // Pause all
    simnet.callPublicFn("billing", "set-paused", [Cl.bool(true)], deployer);
    simnet.callPublicFn("data-tracking", "set-paused", [Cl.bool(true)], deployer);
    simnet.callPublicFn("marketplace", "set-paused", [Cl.bool(true)], deployer);

    const subResult = simnet.callPublicFn(
      "billing",
      "subscribe-and-pay",
      [
        Cl.uint(10),
        Cl.contractPrincipal(deployer, "data-tracking"),
        Cl.uint(0),
      ],
      wallet1
    );
    expect(subResult.result).toBeErr(Cl.uint(207));

    // Unpause all
    simnet.callPublicFn("billing", "set-paused", [Cl.bool(false)], deployer);
    simnet.callPublicFn("data-tracking", "set-paused", [Cl.bool(false)], deployer);
    simnet.callPublicFn("marketplace", "set-paused", [Cl.bool(false)], deployer);
  });

  it("carrier records usage after user subscribes", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(20), Cl.uint(2000), Cl.uint(500), Cl.uint(20000000)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "subscribe-to-plan",
      [Cl.uint(20), Cl.bool(false)],
      wallet1
    );
    simnet.callPublicFn(
      "data-tracking",
      "authorize-carrier",
      [Cl.principal(wallet2)],
      deployer
    );

    const recordResult = simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet1), Cl.uint(200)],
      wallet2
    );
    expect(recordResult.result).toBeOk(Cl.bool(true));

    const userData = simnet.callReadOnlyFn(
      "data-tracking",
      "get-user-data",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(userData.result).toBeSome(
      expect.objectContaining({ type: expect.any(Number) })
    );
  });
});
