import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("data-tracking coverage", () => {
  it("check-plan-validity returns true for active plan", () => {
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

    const result = simnet.callPublicFn(
      "data-tracking",
      "check-plan-validity",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeOk(Cl.bool(true));
  });

  it("get-usage returns ok for subscribed user", () => {
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

    const result = simnet.callPublicFn(
      "data-tracking",
      "get-usage",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeOk(expect.anything());
  });

  it("get-total-plans increments on each set-data-plan", () => {
    const before = simnet.callReadOnlyFn(
      "data-tracking",
      "get-total-plans",
      [],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(1000), Cl.uint(500), Cl.uint(100)],
      deployer
    );
    const after = simnet.callReadOnlyFn(
      "data-tracking",
      "get-total-plans",
      [],
      deployer
    );
    const beforeVal = Number((before.result as any).value ?? 0);
    const afterVal = Number((after.result as any).value ?? 0);
    expect(afterVal).toBe(beforeVal + 1);
  });
});
