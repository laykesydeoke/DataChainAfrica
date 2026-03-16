import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("user plan query helpers", () => {
  it("get-plan-expiry returns some for subscriber", () => {
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

    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "get-plan-expiry",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeSome(expect.anything());
  });

  it("get-user-plan-type returns plan id", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(2), Cl.uint(1000), Cl.uint(300), Cl.uint(100)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "subscribe-to-plan",
      [Cl.uint(2), Cl.bool(false)],
      wallet1
    );

    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "get-user-plan-type",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeSome(Cl.uint(2));
  });

  it("get-user-auto-renew returns subscription setting", () => {
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

    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "get-user-auto-renew",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeSome(Cl.bool(true));
  });
});
