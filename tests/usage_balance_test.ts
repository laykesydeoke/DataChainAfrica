import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("usage and balance management", () => {
  it("data balance decreases after usage", () => {
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
      "record-usage",
      [Cl.principal(wallet1), Cl.uint(400)],
      deployer
    );

    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "get-user-data",
      [Cl.principal(wallet1)],
      wallet1
    );
    const data = result.result as any;
    const balance = Number(data.value?.data?.["data-balance"]?.value ?? -1);
    expect(balance).toBe(600);
  });

  it("exceeding balance fails with error", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(100), Cl.uint(500), Cl.uint(100)],
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

    const result = simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet1), Cl.uint(500)],
      deployer
    );
    expect(result.result).toBeErr(Cl.uint(102));
  });

  it("total data used accumulates correctly", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(5000), Cl.uint(500), Cl.uint(100)],
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
      "record-usage",
      [Cl.principal(wallet1), Cl.uint(100)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet1), Cl.uint(200)],
      deployer
    );

    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "get-user-data",
      [Cl.principal(wallet1)],
      wallet1
    );
    const data = result.result as any;
    const used = Number(data.value?.data?.["total-data-used"]?.value ?? -1);
    expect(used).toBe(300);
  });
});
