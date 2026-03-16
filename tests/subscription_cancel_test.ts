import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("subscription cancellation governance", () => {
  it("user can cancel their subscription", () => {
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
    const cancel = simnet.callPublicFn(
      "data-tracking",
      "cancel-subscription",
      [],
      wallet1
    );
    expect(cancel.result).toBeOk(Cl.bool(true));
  });

  it("has-active-subscription false after cancel", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(500), Cl.uint(100)],
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
      "cancel-subscription",
      [],
      wallet1
    );
    const active = simnet.callReadOnlyFn(
      "data-tracking",
      "has-active-subscription",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(active.result).toBeBool(false);
  });

  it("cancel without subscription fails", () => {
    const cancel = simnet.callPublicFn(
      "data-tracking",
      "cancel-subscription",
      [],
      wallet1
    );
    expect(cancel.result).toBeErr(Cl.uint(104));
  });
});
