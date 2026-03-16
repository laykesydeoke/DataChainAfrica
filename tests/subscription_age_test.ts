import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;

describe("subscription age", () => {
  it("returns 0 for non-subscriber", () => {
    const result = simnet.callReadOnlyFn(
      "billing",
      "get-subscription-age",
      [Cl.principal(wallet2)],
      deployer
    );
    expect(result.result).toBeUint(0);
  });

  it("returns block count after subscribe", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(100000000)],
      deployer
    );
    simnet.callPublicFn(
      "billing",
      "subscribe-and-pay",
      [
        Cl.uint(1),
        Cl.contractPrincipal(deployer, "data-tracking"),
        Cl.uint(0),
      ],
      wallet1
    );

    const result = simnet.callReadOnlyFn(
      "billing",
      "get-subscription-age",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(result.result).toBeUint(0);
  });

  it("has-active-subscription returns false for non-subscriber", () => {
    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "has-active-subscription",
      [Cl.principal(wallet2)],
      deployer
    );
    expect(result.result).toBeBool(false);
  });

  it("has-active-subscription returns true after subscribe", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(100000000)],
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
      "has-active-subscription",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(result.result).toBeBool(true);
  });
});
