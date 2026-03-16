import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;

describe("plan performance telemetry", () => {
  it("plan data accessible after creation", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(7), Cl.uint(3000), Cl.uint(288), Cl.uint(250)],
      deployer
    );
    const plan = simnet.callReadOnlyFn(
      "data-tracking",
      "get-data-plan",
      [Cl.uint(7)],
      deployer
    );
    expect(plan.result).not.toBeNone();
  });

  it("multiple users on same plan tracked separately", () => {
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
    simnet.callPublicFn(
      "data-tracking",
      "subscribe-to-plan",
      [Cl.uint(1), Cl.bool(false)],
      wallet2
    );
    const data1 = simnet.callReadOnlyFn(
      "data-tracking",
      "get-user-telemetry",
      [Cl.principal(wallet1)],
      wallet1
    );
    const data2 = simnet.callReadOnlyFn(
      "data-tracking",
      "get-user-telemetry",
      [Cl.principal(wallet2)],
      wallet2
    );
    expect(data1.result).not.toBeNone();
    expect(data2.result).not.toBeNone();
  });

  it("network summary reflects both subscribers", () => {
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
    simnet.callPublicFn(
      "data-tracking",
      "subscribe-to-plan",
      [Cl.uint(1), Cl.bool(false)],
      wallet2
    );
    const summary = simnet.callReadOnlyFn(
      "data-tracking",
      "get-network-summary",
      [],
      deployer
    );
    const users = Number(
      (summary.result as any).value?.data?.["total-unique-users"]?.value ?? 0
    );
    expect(users).toBeGreaterThanOrEqual(2);
  });
});
