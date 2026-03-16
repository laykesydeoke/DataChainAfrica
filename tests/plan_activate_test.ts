import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("plan activation and deactivation", () => {
  it("deactivated plan cannot be subscribed to", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(100)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "deactivate-plan",
      [Cl.uint(1)],
      deployer
    );

    const result = simnet.callPublicFn(
      "data-tracking",
      "subscribe-to-plan",
      [Cl.uint(1), Cl.bool(false)],
      wallet1
    );
    expect(result.result).toBeErr(Cl.uint(107));
  });

  it("plan is active after set-data-plan", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(100)],
      deployer
    );

    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "get-plan-details",
      [Cl.uint(1)],
      deployer
    );
    const plan = result.result as any;
    const isActive = plan.value?.data?.["is-active"]?.value;
    expect(isActive).toBe(true);
  });

  it("non-owner cannot deactivate plan", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(100)],
      deployer
    );

    const result = simnet.callPublicFn(
      "data-tracking",
      "deactivate-plan",
      [Cl.uint(1)],
      wallet1
    );
    expect(result.result).toBeErr(Cl.uint(100));
  });
});
