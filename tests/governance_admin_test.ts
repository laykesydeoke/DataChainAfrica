import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("governance admin controls", () => {
  it("only owner can set a new data plan", () => {
    const result = simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(10), Cl.uint(5000), Cl.uint(288), Cl.uint(500)],
      wallet1
    );
    expect(result.result).toBeErr(Cl.uint(100));
  });

  it("plan data is readable by all after creation", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(5), Cl.uint(2000), Cl.uint(100), Cl.uint(300)],
      deployer
    );
    const plan = simnet.callReadOnlyFn(
      "data-tracking",
      "get-data-plan",
      [Cl.uint(5)],
      wallet1
    );
    expect(plan.result).not.toBeNone();
  });

  it("network stats are publicly readable", () => {
    const stats = simnet.callReadOnlyFn(
      "data-tracking",
      "get-network-stats",
      [],
      wallet1
    );
    expect(stats.result).not.toBeNone();
  });

  it("owner can update existing plan price", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(6), Cl.uint(1000), Cl.uint(50), Cl.uint(100)],
      deployer
    );
    const update = simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(6), Cl.uint(1000), Cl.uint(50), Cl.uint(200)],
      deployer
    );
    expect(update.result).toBeOk(Cl.bool(true));
  });
});
