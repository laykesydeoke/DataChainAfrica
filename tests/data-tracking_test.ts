import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;

describe("data-tracking contract", () => {
  it("allows owner to set a data plan", () => {
    const { result } = simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(50000000)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("prevents non-owner from setting plans", () => {
    const { result } = simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(10), Cl.uint(100), Cl.uint(50), Cl.uint(10000000)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(100));
  });

  it("allows user to subscribe to a plan", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(50000000)],
      deployer
    );

    const { result } = simnet.callPublicFn(
      "data-tracking",
      "subscribe-to-plan",
      [Cl.uint(1), Cl.bool(false)],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("returns user data after subscribing", () => {
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

  it("allows authorized carrier to record usage", () => {
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
    simnet.callPublicFn(
      "data-tracking",
      "authorize-carrier",
      [Cl.principal(wallet2)],
      deployer
    );

    const { result } = simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet1), Cl.uint(100)],
      wallet2
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("prevents unauthorized carrier from recording", () => {
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

    const { result } = simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet1), Cl.uint(100)],
      wallet2
    );
    expect(result).toBeErr(Cl.uint(101));
  });

  it("prevents usage exceeding balance", () => {
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
    simnet.callPublicFn(
      "data-tracking",
      "authorize-carrier",
      [Cl.principal(wallet2)],
      deployer
    );

    const { result } = simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet1), Cl.uint(600)],
      wallet2
    );
    expect(result).toBeErr(Cl.uint(102));
  });

  it("allows owner to update plan", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(50000000)],
      deployer
    );

    const { result } = simnet.callPublicFn(
      "data-tracking",
      "update-plan",
      [Cl.uint(1), Cl.uint(1000), Cl.uint(288), Cl.uint(90000000)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("returns plan validity check", () => {
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

    const { result } = simnet.callPublicFn(
      "data-tracking",
      "check-plan-validity",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("starts unpaused", () => {
    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "get-paused",
      [],
      deployer
    );
    expect(result.result).toBeBool(false);
  });

  it("owner can pause data-tracking", () => {
    const { result } = simnet.callPublicFn(
      "data-tracking",
      "set-paused",
      [Cl.bool(true)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    const paused = simnet.callReadOnlyFn(
      "data-tracking",
      "get-paused",
      [],
      deployer
    );
    expect(paused.result).toBeBool(true);

    simnet.callPublicFn(
      "data-tracking",
      "set-paused",
      [Cl.bool(false)],
      deployer
    );
  });

  it("subscribe-to-plan fails when paused", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(50000000)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "set-paused",
      [Cl.bool(true)],
      deployer
    );

    const { result } = simnet.callPublicFn(
      "data-tracking",
      "subscribe-to-plan",
      [Cl.uint(1), Cl.bool(false)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(106));

    simnet.callPublicFn(
      "data-tracking",
      "set-paused",
      [Cl.bool(false)],
      deployer
    );
  });

  it("owner can deactivate a plan", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(5), Cl.uint(500), Cl.uint(144), Cl.uint(50000000)],
      deployer
    );

    const { result } = simnet.callPublicFn(
      "data-tracking",
      "deactivate-plan",
      [Cl.uint(5)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("deactivated plan cannot be subscribed to", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(5), Cl.uint(500), Cl.uint(144), Cl.uint(50000000)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "deactivate-plan",
      [Cl.uint(5)],
      deployer
    );

    const { result } = simnet.callPublicFn(
      "data-tracking",
      "subscribe-to-plan",
      [Cl.uint(5), Cl.bool(false)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(107));
  });

  it("get-total-plans increments on set-data-plan", () => {
    const before = simnet.callReadOnlyFn(
      "data-tracking",
      "get-total-plans",
      [],
      deployer
    );

    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(99), Cl.uint(1000), Cl.uint(144), Cl.uint(10000000)],
      deployer
    );

    const after = simnet.callReadOnlyFn(
      "data-tracking",
      "get-total-plans",
      [],
      deployer
    );

    expect(Number((after.result as any).value)).toBeGreaterThan(
      Number((before.result as any).value)
    );
  });
});
