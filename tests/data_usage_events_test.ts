import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("data usage event tracking", () => {
  it("usage events are recorded with incrementing IDs", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(2000), Cl.uint(144), Cl.uint(100)],
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
    const event1 = simnet.callReadOnlyFn(
      "data-tracking",
      "get-usage-event",
      [Cl.uint(1)],
      deployer
    );
    const event2 = simnet.callReadOnlyFn(
      "data-tracking",
      "get-usage-event",
      [Cl.uint(2)],
      deployer
    );
    expect(event1.result).not.toBeNone();
    expect(event2.result).not.toBeNone();
  });

  it("event counter increments after each usage", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(2000), Cl.uint(144), Cl.uint(100)],
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
    const before = simnet.callReadOnlyFn(
      "data-tracking",
      "get-event-counter",
      [],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet1), Cl.uint(50)],
      deployer
    );
    const after = simnet.callReadOnlyFn(
      "data-tracking",
      "get-event-counter",
      [],
      deployer
    );
    expect(Number((after.result as any).value ?? 0)).toBeGreaterThan(
      Number((before.result as any).value ?? 0)
    );
  });
});
