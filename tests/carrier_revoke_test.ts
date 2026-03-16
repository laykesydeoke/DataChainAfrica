import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;

describe("carrier revocation governance", () => {
  it("owner can revoke carrier authorization", () => {
    simnet.callPublicFn(
      "data-tracking",
      "authorize-carrier",
      [Cl.principal(wallet2)],
      deployer
    );
    const revoke = simnet.callPublicFn(
      "data-tracking",
      "revoke-carrier",
      [Cl.principal(wallet2)],
      deployer
    );
    expect(revoke.result).toBeOk(Cl.bool(true));
  });

  it("revoked carrier cannot record usage", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(100)],
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
    const usage = simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet1), Cl.uint(100)],
      wallet2
    );
    expect(usage.result).toBeErr(Cl.uint(103));
  });

  it("non-owner cannot revoke carrier", () => {
    simnet.callPublicFn(
      "data-tracking",
      "authorize-carrier",
      [Cl.principal(wallet2)],
      deployer
    );
    const revoke = simnet.callPublicFn(
      "data-tracking",
      "revoke-carrier",
      [Cl.principal(wallet2)],
      wallet1
    );
    expect(revoke.result).toBeErr(Cl.uint(100));
  });
});
