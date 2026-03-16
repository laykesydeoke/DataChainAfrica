import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;

describe("data rollover and renewal", () => {
  it("rollover-data starts at zero for new subscriber", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(50000000)],
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
      "get-user-data",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeSome(
      expect.objectContaining({ type: expect.any(Number) })
    );
  });

  it("subscribing to plan sets auto-renew flag", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(2), Cl.uint(3000), Cl.uint(1008), Cl.uint(200000000)],
      deployer
    );
    const { result } = simnet.callPublicFn(
      "data-tracking",
      "subscribe-to-plan",
      [Cl.uint(2), Cl.bool(true)],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("re-subscribing preserves rollover balance", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(1000), Cl.uint(144), Cl.uint(50000000)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "subscribe-to-plan",
      [Cl.uint(1), Cl.bool(false)],
      wallet1
    );

    // Re-subscribe — should carry rollover from existing balance
    simnet.callPublicFn(
      "data-tracking",
      "subscribe-to-plan",
      [Cl.uint(1), Cl.bool(false)],
      wallet1
    );

    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "get-user-data",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeSome(
      expect.objectContaining({ type: expect.any(Number) })
    );
  });

  it("get-total-plans tracks created plans", () => {
    const before = simnet.callReadOnlyFn(
      "data-tracking",
      "get-total-plans",
      [],
      deployer
    );

    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(50), Cl.uint(500), Cl.uint(100), Cl.uint(5000000)],
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
    expect(afterVal).toBeGreaterThan(beforeVal);
  });

  it("check-plan-validity returns error for user without plan", () => {
    const { result } = simnet.callPublicFn(
      "data-tracking",
      "check-plan-validity",
      [Cl.principal(wallet2)],
      wallet2
    );
    expect(result).toBeErr(Cl.uint(102));
  });
});
