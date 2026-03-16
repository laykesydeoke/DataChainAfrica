import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("plan deactivation governance", () => {
  it("owner can deactivate a plan", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(3), Cl.uint(300), Cl.uint(144), Cl.uint(150)],
      deployer
    );
    const deactivate = simnet.callPublicFn(
      "data-tracking",
      "deactivate-plan",
      [Cl.uint(3)],
      deployer
    );
    expect(deactivate.result).toBeOk(Cl.bool(true));
  });

  it("non-owner cannot deactivate a plan", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(3), Cl.uint(300), Cl.uint(144), Cl.uint(150)],
      deployer
    );
    const deactivate = simnet.callPublicFn(
      "data-tracking",
      "deactivate-plan",
      [Cl.uint(3)],
      wallet1
    );
    expect(deactivate.result).toBeErr(Cl.uint(100));
  });

  it("user cannot subscribe to inactive plan", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(4), Cl.uint(200), Cl.uint(50), Cl.uint(100)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "deactivate-plan",
      [Cl.uint(4)],
      deployer
    );
    const sub = simnet.callPublicFn(
      "data-tracking",
      "subscribe-to-plan",
      [Cl.uint(4), Cl.bool(false)],
      wallet1
    );
    expect(sub.result).toBeErr(Cl.uint(101));
  });
});
