import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("admin pause controls", () => {
  it("paused data-tracking blocks record-usage", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(1000), Cl.uint(500), Cl.uint(100)],
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
      "set-paused",
      [Cl.bool(true)],
      deployer
    );

    const result = simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet1), Cl.uint(100)],
      deployer
    );
    expect(result.result).toBeErr(Cl.uint(106));
  });

  it("unpausing restores record-usage", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(1000), Cl.uint(500), Cl.uint(100)],
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
      "set-paused",
      [Cl.bool(true)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "set-paused",
      [Cl.bool(false)],
      deployer
    );

    const result = simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet1), Cl.uint(100)],
      deployer
    );
    expect(result.result).toBeOk(Cl.bool(true));
  });

  it("non-owner cannot pause contracts", () => {
    const result = simnet.callPublicFn(
      "data-tracking",
      "set-paused",
      [Cl.bool(true)],
      wallet1
    );
    expect(result.result).toBeErr(Cl.uint(100));
  });
});
