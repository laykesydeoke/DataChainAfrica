import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;

describe("carrier authorization", () => {
  it("only owner can authorize a carrier", () => {
    const result = simnet.callPublicFn(
      "data-tracking",
      "authorize-carrier",
      [Cl.principal(wallet1)],
      wallet2
    );
    expect(result.result).toBeErr(Cl.uint(100));
  });

  it("authorized carrier can record usage", () => {
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
      wallet2
    );
    simnet.callPublicFn(
      "data-tracking",
      "authorize-carrier",
      [Cl.principal(wallet1)],
      deployer
    );

    const result = simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet2), Cl.uint(50)],
      wallet1
    );
    expect(result.result).toBeOk(Cl.bool(true));
  });

  it("revoked carrier cannot record usage", () => {
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
      wallet2
    );
    simnet.callPublicFn(
      "data-tracking",
      "authorize-carrier",
      [Cl.principal(wallet1)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "revoke-carrier",
      [Cl.principal(wallet1)],
      deployer
    );

    const result = simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet2), Cl.uint(50)],
      wallet1
    );
    expect(result.result).toBeErr(Cl.uint(101));
  });

  it("is-carrier-authorized reflects current state", () => {
    simnet.callPublicFn(
      "data-tracking",
      "authorize-carrier",
      [Cl.principal(wallet1)],
      deployer
    );
    const auth = simnet.callReadOnlyFn(
      "data-tracking",
      "is-carrier-authorized",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(auth.result).toBeBool(true);

    simnet.callPublicFn(
      "data-tracking",
      "revoke-carrier",
      [Cl.principal(wallet1)],
      deployer
    );
    const revoked = simnet.callReadOnlyFn(
      "data-tracking",
      "is-carrier-authorized",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(revoked.result).toBeBool(false);
  });
});
