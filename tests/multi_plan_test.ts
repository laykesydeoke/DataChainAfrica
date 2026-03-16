import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;

describe("multiple plan management", () => {
  it("multiple plans can exist simultaneously", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(100000000)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(2), Cl.uint(2000), Cl.uint(1000), Cl.uint(350000000)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(3), Cl.uint(5000), Cl.uint(4320), Cl.uint(800000000)],
      deployer
    );

    const p1 = simnet.callReadOnlyFn(
      "data-tracking",
      "get-plan-details",
      [Cl.uint(1)],
      deployer
    );
    const p2 = simnet.callReadOnlyFn(
      "data-tracking",
      "get-plan-details",
      [Cl.uint(2)],
      deployer
    );
    const p3 = simnet.callReadOnlyFn(
      "data-tracking",
      "get-plan-details",
      [Cl.uint(3)],
      deployer
    );
    expect(p1.result).toBeSome(expect.anything());
    expect(p2.result).toBeSome(expect.anything());
    expect(p3.result).toBeSome(expect.anything());
  });

  it("different users can subscribe to different plans", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(100000000)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(2), Cl.uint(2000), Cl.uint(1000), Cl.uint(350000000)],
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
      [Cl.uint(2), Cl.bool(false)],
      wallet2
    );

    const d1 = simnet.callReadOnlyFn(
      "data-tracking",
      "get-user-data",
      [Cl.principal(wallet1)],
      wallet1
    );
    const d2 = simnet.callReadOnlyFn(
      "data-tracking",
      "get-user-data",
      [Cl.principal(wallet2)],
      wallet2
    );

    const plan1 = (d1.result as any).value?.data?.["plan-type"]?.value;
    const plan2 = (d2.result as any).value?.data?.["plan-type"]?.value;
    expect(Number(plan1)).toBe(1);
    expect(Number(plan2)).toBe(2);
  });

  it("plan counter increments for each new plan", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(100)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(2), Cl.uint(1000), Cl.uint(288), Cl.uint(200)],
      deployer
    );

    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "get-total-plans",
      [],
      deployer
    );
    expect(result.result).toBeUint(2);
  });
});
