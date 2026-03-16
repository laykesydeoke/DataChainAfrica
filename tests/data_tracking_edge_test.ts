import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;

describe("data-tracking edge cases", () => {
  it("record-usage without subscription fails", () => {
    simnet.callPublicFn(
      "data-tracking",
      "authorize-carrier",
      [Cl.principal(deployer)],
      deployer
    );
    const { result } = simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet2), Cl.uint(50)],
      deployer
    );
    expect(result).toBeErr(Cl.uint(102));
  });

  it("process-plan-expiry before expiry fails", () => {
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

    const { result } = simnet.callPublicFn(
      "data-tracking",
      "process-plan-expiry",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(result).toBeErr(Cl.uint(102));
  });

  it("get-usage fails for non-subscriber", () => {
    const result = simnet.callPublicFn(
      "data-tracking",
      "get-usage",
      [Cl.principal(wallet2)],
      deployer
    );
    expect(result.result).toBeErr(Cl.uint(102));
  });

  it("check-plan-validity fails for non-subscriber", () => {
    const { result } = simnet.callPublicFn(
      "data-tracking",
      "check-plan-validity",
      [Cl.principal(wallet2)],
      deployer
    );
    expect(result).toBeErr(Cl.uint(102));
  });

  it("set-auto-renew without data fails", () => {
    const { result } = simnet.callPublicFn(
      "data-tracking",
      "set-auto-renew",
      [Cl.bool(true)],
      wallet2
    );
    expect(result).toBeErr(Cl.uint(102));
  });

  it("zero usage does not fail", () => {
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
    const { result } = simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet1), Cl.uint(0)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });
});
