import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("auto-renew toggle", () => {
  it("user can toggle auto-renew on", () => {
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
      "set-auto-renew",
      [Cl.bool(true)],
      wallet1
    );

    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "get-user-auto-renew",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeSome(Cl.bool(true));
  });

  it("user can toggle auto-renew off", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(100)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "subscribe-to-plan",
      [Cl.uint(1), Cl.bool(true)],
      wallet1
    );
    simnet.callPublicFn(
      "data-tracking",
      "set-auto-renew",
      [Cl.bool(false)],
      wallet1
    );

    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "get-user-auto-renew",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeSome(Cl.bool(false));
  });

  it("toggle fails without subscription", () => {
    const result = simnet.callPublicFn(
      "data-tracking",
      "set-auto-renew",
      [Cl.bool(true)],
      wallet1
    );
    expect(result.result).toBeErr(Cl.uint(102));
  });
});
