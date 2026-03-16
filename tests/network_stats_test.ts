import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;

describe("network usage stats", () => {
  it("total data recorded starts at zero", () => {
    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "get-total-data-recorded",
      [],
      deployer
    );
    expect(result.result).toBeUint(0);
  });

  it("total unique users starts at zero", () => {
    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "get-total-unique-users",
      [],
      deployer
    );
    expect(result.result).toBeUint(0);
  });

  it("network summary returns correct structure", () => {
    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "get-network-summary",
      [],
      deployer
    );
    expect(result.result).toBeTuple({
      "total-data-recorded": Cl.uint(0),
      "total-unique-users": Cl.uint(0),
      "total-events": Cl.uint(0),
      "total-plans": Cl.uint(0),
    });
  });

  it("unique user count increments on first subscription", () => {
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

    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "get-total-unique-users",
      [],
      deployer
    );
    expect(result.result).toBeUint(1);
  });

  it("total data recorded increments on usage record", () => {
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
      "data-tracking",
      "authorize-carrier",
      [Cl.principal(deployer)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet1), Cl.uint(50)],
      deployer
    );

    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "get-total-data-recorded",
      [],
      deployer
    );
    expect(result.result).toBeUint(50);
  });

  it("plan counter increments on new plan creation", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(5), Cl.uint(500), Cl.uint(144), Cl.uint(250)],
      deployer
    );

    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "get-total-plans",
      [],
      deployer
    );
    expect(result.result).toBeUint(1);
  });
});
