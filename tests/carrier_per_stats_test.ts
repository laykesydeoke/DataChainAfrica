import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;

describe("per-carrier statistics", () => {
  it("carrier stats update after record-usage", () => {
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
      "data-tracking",
      "authorize-carrier",
      [Cl.principal(deployer)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet1), Cl.uint(250)],
      deployer
    );

    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "get-carrier-stats",
      [Cl.principal(deployer)],
      deployer
    );
    expect(result.result).toBeTuple({
      "total-usage-reported": Cl.uint(250),
      "total-events": Cl.uint(1),
      "last-report-block": Cl.uint(simnet.blockHeight - 1),
    });
  });

  it("carrier total usage sums across events", () => {
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
      "data-tracking",
      "authorize-carrier",
      [Cl.principal(deployer)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet1), Cl.uint(100)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet1), Cl.uint(200)],
      deployer
    );

    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "get-carrier-total-usage",
      [Cl.principal(deployer)],
      deployer
    );
    expect(result.result).toBeUint(300);
  });

  it("two carriers have independent stats", () => {
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
      "data-tracking",
      "authorize-carrier",
      [Cl.principal(deployer)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "authorize-carrier",
      [Cl.principal(wallet1)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet2), Cl.uint(150)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet2), Cl.uint(100)],
      wallet1
    );

    const stats1 = simnet.callReadOnlyFn(
      "data-tracking",
      "get-carrier-total-usage",
      [Cl.principal(deployer)],
      deployer
    );
    const stats2 = simnet.callReadOnlyFn(
      "data-tracking",
      "get-carrier-total-usage",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(stats1.result).toBeUint(150);
    expect(stats2.result).toBeUint(100);
  });
});
