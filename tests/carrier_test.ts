import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;
const wallet3 = simnet.getAccounts().get("wallet_3")!;

describe("carrier authorization", () => {
  it("owner can authorize a carrier", () => {
    const { result } = simnet.callPublicFn(
      "data-tracking",
      "authorize-carrier",
      [Cl.principal(wallet2)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("authorized carrier is recognized", () => {
    simnet.callPublicFn(
      "data-tracking",
      "authorize-carrier",
      [Cl.principal(wallet2)],
      deployer
    );

    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "is-carrier-authorized",
      [Cl.principal(wallet2)],
      deployer
    );
    expect(result.result).toBeBool(true);
  });

  it("non-owner cannot authorize carrier", () => {
    const { result } = simnet.callPublicFn(
      "data-tracking",
      "authorize-carrier",
      [Cl.principal(wallet3)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(100));
  });

  it("owner can revoke carrier", () => {
    simnet.callPublicFn(
      "data-tracking",
      "authorize-carrier",
      [Cl.principal(wallet2)],
      deployer
    );

    const { result } = simnet.callPublicFn(
      "data-tracking",
      "revoke-carrier",
      [Cl.principal(wallet2)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("revoked carrier is no longer authorized", () => {
    simnet.callPublicFn(
      "data-tracking",
      "authorize-carrier",
      [Cl.principal(wallet2)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "revoke-carrier",
      [Cl.principal(wallet2)],
      deployer
    );

    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "is-carrier-authorized",
      [Cl.principal(wallet2)],
      deployer
    );
    expect(result.result).toBeBool(false);
  });

  it("revoked carrier cannot record usage", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(50000000)],
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
      [Cl.principal(wallet2)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "revoke-carrier",
      [Cl.principal(wallet2)],
      deployer
    );

    const { result } = simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet1), Cl.uint(50)],
      wallet2
    );
    expect(result).toBeErr(Cl.uint(101));
  });

  it("multiple carriers can be authorized simultaneously", () => {
    simnet.callPublicFn(
      "data-tracking",
      "authorize-carrier",
      [Cl.principal(wallet2)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "authorize-carrier",
      [Cl.principal(wallet3)],
      deployer
    );

    const r2 = simnet.callReadOnlyFn(
      "data-tracking",
      "is-carrier-authorized",
      [Cl.principal(wallet2)],
      deployer
    );
    const r3 = simnet.callReadOnlyFn(
      "data-tracking",
      "is-carrier-authorized",
      [Cl.principal(wallet3)],
      deployer
    );
    expect(r2.result).toBeBool(true);
    expect(r3.result).toBeBool(true);
  });
});
