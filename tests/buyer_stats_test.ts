import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;

describe("buyer stats tracking", () => {
  it("new buyer has zero stats by default", () => {
    const result = simnet.callReadOnlyFn(
      "marketplace",
      "get-buyer-stats",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeTuple({
      "total-purchases": Cl.uint(0),
      "total-data-bought": Cl.uint(0),
      "total-spent": Cl.uint(0),
    });
  });

  it("get-user-purchases returns none for unknown buyer", () => {
    const result = simnet.callReadOnlyFn(
      "marketplace",
      "get-user-purchases",
      [Cl.principal(wallet2)],
      wallet2
    );
    expect(result.result).toBeNone();
  });

  it("buyer stats update after purchase", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(1000), Cl.uint(144), Cl.uint(500)],
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
        Cl.uint(300),
        Cl.uint(500),
        Cl.contractPrincipal(deployer, "data-tracking"),
      ],
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
      "get-buyer-stats",
      [Cl.principal(wallet2)],
      wallet2
    );
    expect(stats.result).toBeTuple({
      "total-purchases": Cl.uint(1),
      "total-data-bought": Cl.uint(100),
      "total-spent": Cl.uint(300),
    });
  });

  it("get-user-purchases returns some after first buy", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(2), Cl.uint(2000), Cl.uint(288), Cl.uint(800)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "subscribe-to-plan",
      [Cl.uint(2), Cl.bool(false)],
      wallet1
    );
    simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [
        Cl.uint(200),
        Cl.uint(400),
        Cl.uint(500),
        Cl.contractPrincipal(deployer, "data-tracking"),
      ],
      wallet1
    );
    simnet.callPublicFn(
      "marketplace",
      "purchase-listing",
      [Cl.uint(1), Cl.contractPrincipal(deployer, "data-tracking")],
      wallet2
    );

    const result = simnet.callReadOnlyFn(
      "marketplace",
      "get-user-purchases",
      [Cl.principal(wallet2)],
      wallet2
    );
    expect(result.result).toBeSome(
      expect.objectContaining({ type: expect.any(Number) })
    );
  });

  it("platform stats include total volume", () => {
    const stats = simnet.callReadOnlyFn(
      "marketplace",
      "get-platform-stats",
      [],
      deployer
    );
    expect(stats.result).toBeTuple({
      "total-volume": Cl.uint(0),
      "total-trades": Cl.uint(0),
      "total-listings": Cl.uint(0),
    });
  });
});
