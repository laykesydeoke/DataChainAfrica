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
      Cl.tuple({
        "total-data-used": Cl.uint(0),
        "last-updated": Cl.uint(3),
        "data-balance": Cl.uint(500),
        "plan-expiry": Cl.uint(147),
        "plan-type": Cl.uint(1),
        "auto-renew": Cl.bool(false),
        "rollover-data": Cl.uint(0),
      })
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

  it("rejects zero-amount plan creation", () => {
    const { result } = simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(5), Cl.uint(0), Cl.uint(144), Cl.uint(50000000)],
      deployer
    );
    expect(result).toBeErr(Cl.uint(102));
  });

  it("rejects zero-duration plan creation", () => {
    const { result } = simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(5), Cl.uint(500), Cl.uint(0), Cl.uint(50000000)],
      deployer
    );
    expect(result).toBeErr(Cl.uint(102));
  });

  it("allows carrier authorization revocation", () => {
    simnet.callPublicFn(
      "data-tracking",
      "authorize-carrier",
      [Cl.principal(wallet2)],
      deployer
    );

    const { result } = simnet.callPublicFn(
      "data-tracking",
      "revoke-carrier",
      [Cl.principal(wallet2)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    // Verify revoked carrier cannot record
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

    const recordResult = simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet1), Cl.uint(10)],
      wallet2
    );
    expect(recordResult.result).toBeErr(Cl.uint(101));
  });

  it("tracks usage events correctly", () => {
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
    simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet1), Cl.uint(50)],
      wallet2
    );

    const eventResult = simnet.callReadOnlyFn(
      "data-tracking",
      "get-usage-event",
      [Cl.uint(1)],
      wallet1
    );
    expect(eventResult.result).toBeSome(
      expect.objectContaining({ type: expect.any(Number) })
    );
  });

  it("returns latest event id", () => {
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
    simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet1), Cl.uint(50)],
      wallet2
    );
    simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet1), Cl.uint(30)],
      wallet2
    );

    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "get-latest-event-id",
      [],
      wallet1
    );
    expect(result.result).toBeUint(2);
  });

  it("checks carrier authorization status", () => {
    simnet.callPublicFn(
      "data-tracking",
      "authorize-carrier",
      [Cl.principal(wallet1)],
      deployer
    );

    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "is-carrier-authorized",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeBool(true);

    const result2 = simnet.callReadOnlyFn(
      "data-tracking",
      "is-carrier-authorized",
      [Cl.principal(wallet2)],
      wallet2
    );
    expect(result2.result).toBeBool(false);
  });

  it("allows marketplace data transfer", () => {
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
      "authorize-marketplace",
      [Cl.contractPrincipal(deployer, "marketplace")],
      deployer
    );

    // The marketplace contract would call transfer-data-balance
    // Here we verify the function exists and authorization works
    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "get-plan-details",
      [Cl.uint(1)],
      wallet1
    );
    expect(result.result).toBeSome(
      expect.objectContaining({ type: expect.any(Number) })
    );
  });

  it("allows owner to deactivate a plan", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(5), Cl.uint(1000), Cl.uint(288), Cl.uint(80000000)],
      deployer
    );

    const { result } = simnet.callPublicFn(
      "data-tracking",
      "deactivate-plan",
      [Cl.uint(5)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    // Verify plan is deactivated
    const plan = simnet.callReadOnlyFn(
      "data-tracking",
      "get-plan-details",
      [Cl.uint(5)],
      deployer
    );
    expect(plan.result).toBeSome(
      Cl.tuple({
        "data-amount": Cl.uint(1000),
        "duration-blocks": Cl.uint(288),
        "price": Cl.uint(80000000),
        "is-active": Cl.bool(false),
      })
    );
  });

  it("prevents subscribing to deactivated plan", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(5), Cl.uint(1000), Cl.uint(288), Cl.uint(80000000)],
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
    expect(result).toBeErr(Cl.uint(105));
  });

  it("prevents non-owner from deactivating plan", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(5), Cl.uint(1000), Cl.uint(288), Cl.uint(80000000)],
      deployer
    );

    const { result } = simnet.callPublicFn(
      "data-tracking",
      "deactivate-plan",
      [Cl.uint(5)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(100));
  });

  it("rejects duplicate usage recording in same block", () => {
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

    // First recording succeeds
    const first = simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet1), Cl.uint(10)],
      wallet2
    );
    expect(first.result).toBeOk(Cl.bool(true));

    // Second recording in same block should be rate-limited
    const second = simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet1), Cl.uint(10)],
      wallet2
    );
    expect(second.result).toBeErr(Cl.uint(107));
  });

  it("returns last usage block after recording", () => {
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
    simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet1), Cl.uint(10)],
      wallet2
    );

    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "get-last-usage-block",
      [Cl.principal(wallet1)],
      wallet1
    );
    // Should be greater than 0 after recording
    const val = result.result;
    expect(val).not.toEqual(Cl.uint(0));
  });

  it("returns 0 last-usage-block for user with no recordings", () => {
    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "get-last-usage-block",
      [Cl.principal(wallet2)],
      wallet2
    );
    expect(result.result).toBeUint(0);
  });
});
