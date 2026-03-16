import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("plan pricing", () => {
  it("plan price is stored correctly", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(250000000)],
      deployer
    );

    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "get-plan-details",
      [Cl.uint(1)],
      deployer
    );
    const plan = result.result as any;
    const price = Number(plan.value?.data?.price?.value ?? 0);
    expect(price).toBe(250000000);
  });

  it("update-plan changes price", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(100000000)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "update-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(150000000)],
      deployer
    );

    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "get-plan-details",
      [Cl.uint(1)],
      deployer
    );
    const plan = result.result as any;
    const price = Number(plan.value?.data?.price?.value ?? 0);
    expect(price).toBe(150000000);
  });

  it("non-owner cannot update plan price", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(100000000)],
      deployer
    );
    const result = simnet.callPublicFn(
      "data-tracking",
      "update-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(50000000)],
      wallet1
    );
    expect(result.result).toBeErr(Cl.uint(100));
  });
});
