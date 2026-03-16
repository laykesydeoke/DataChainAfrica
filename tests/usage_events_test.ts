import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("usage events tracking", () => {
  it("latest event id starts at zero", () => {
    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "get-latest-event-id",
      [],
      deployer
    );
    expect(result.result).toBeUint(0);
  });

  it("get-usage-event returns none for missing id", () => {
    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "get-usage-event",
      [Cl.uint(999)],
      deployer
    );
    expect(result.result).toBeNone();
  });

  it("event id increments after record-usage", () => {
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
    simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet1), Cl.uint(50)],
      deployer
    );

    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "get-latest-event-id",
      [],
      deployer
    );
    expect(result.result).toBeUint(1);
  });

  it("usage event stored with correct data", () => {
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
    simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet1), Cl.uint(100)],
      deployer
    );

    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "get-usage-event",
      [Cl.uint(1)],
      deployer
    );
    expect(result.result).toBeSome(
      expect.objectContaining({ type: expect.any(Number) })
    );
  });

  it("get-usage-history for user returns event", () => {
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
    simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet1), Cl.uint(75)],
      deployer
    );

    const result = simnet.callPublicFn(
      "data-tracking",
      "get-usage-history",
      [Cl.principal(wallet1), Cl.uint(1)],
      wallet1
    );
    expect(result.result).toBeOk(
      expect.objectContaining({ type: expect.any(Number) })
    );
  });

  it("unauthorized carrier cannot record usage", () => {
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
      "record-usage",
      [Cl.principal(wallet1), Cl.uint(50)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(101));
  });
});
