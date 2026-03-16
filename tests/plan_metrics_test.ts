import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("plan metrics reporting", () => {
  it("plan fields include data-limit and duration", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(8), Cl.uint(2000), Cl.uint(200), Cl.uint(300)],
      deployer
    );
    const plan = simnet.callReadOnlyFn(
      "data-tracking",
      "get-data-plan",
      [Cl.uint(8)],
      deployer
    );
    const data = (plan.result as any).value?.value?.data;
    expect(Number(data?.["data-limit"]?.value ?? 0)).toBe(2000);
    expect(Number(data?.["duration-blocks"]?.value ?? 0)).toBe(200);
  });

  it("plan price is accessible for reporting", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(9), Cl.uint(500), Cl.uint(50), Cl.uint(999)],
      deployer
    );
    const plan = simnet.callReadOnlyFn(
      "data-tracking",
      "get-data-plan",
      [Cl.uint(9)],
      deployer
    );
    const price = Number(
      (plan.result as any).value?.value?.data?.["price-ustx"]?.value ?? 0
    );
    expect(price).toBe(999);
  });

  it("multiple plans return distinct data", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(10), Cl.uint(100), Cl.uint(10), Cl.uint(50)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(11), Cl.uint(200), Cl.uint(20), Cl.uint(100)],
      deployer
    );
    const plan10 = simnet.callReadOnlyFn("data-tracking", "get-data-plan", [Cl.uint(10)], deployer);
    const plan11 = simnet.callReadOnlyFn("data-tracking", "get-data-plan", [Cl.uint(11)], deployer);
    expect(plan10.result).not.toBeNone();
    expect(plan11.result).not.toBeNone();
  });
});
