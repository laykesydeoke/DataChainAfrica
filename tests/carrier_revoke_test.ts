import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("carrier revoke and re-authorize", () => {
  it("revoked carrier cannot record usage", () => {
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
      "revoke-carrier",
      [Cl.principal(deployer)],
      deployer
    );

    const { result } = simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet1), Cl.uint(50)],
      deployer
    );
    expect(result).toBeErr(Cl.uint(101));
  });

  it("re-authorized carrier can record usage", () => {
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
      "revoke-carrier",
      [Cl.principal(deployer)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "authorize-carrier",
      [Cl.principal(deployer)],
      deployer
    );

    const { result } = simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet1), Cl.uint(50)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("is-carrier-authorized returns true for auth carrier", () => {
    simnet.callPublicFn(
      "data-tracking",
      "authorize-carrier",
      [Cl.principal(deployer)],
      deployer
    );
    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "is-carrier-authorized",
      [Cl.principal(deployer)],
      deployer
    );
    expect(result.result).toBeBool(true);
  });

  it("is-carrier-authorized returns false after revoke", () => {
    simnet.callPublicFn(
      "data-tracking",
      "authorize-carrier",
      [Cl.principal(deployer)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "revoke-carrier",
      [Cl.principal(deployer)],
      deployer
    );
    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "is-carrier-authorized",
      [Cl.principal(deployer)],
      deployer
    );
    expect(result.result).toBeBool(false);
  });
});
