import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("governance query functions", () => {
  it("get-user-plan-type returns none before subscribe", () => {
    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "get-user-plan-type",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeNone();
  });

  it("get-user-plan-type returns plan id after subscribe", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(2), Cl.uint(1000), Cl.uint(144), Cl.uint(200)],
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

  it("get-plan-expiry returns none before subscribe", () => {
    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "get-plan-expiry",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeNone();
  });
});
