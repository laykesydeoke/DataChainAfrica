import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("plan management", () => {
  it("owner can create a new plan", () => {
    const { result } = simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(10), Cl.uint(2000), Cl.uint(288), Cl.uint(1500)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("plan is active after creation", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(10), Cl.uint(2000), Cl.uint(288), Cl.uint(1500)],
      deployer
    );
    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "get-plan-details",
      [Cl.uint(10)],
      deployer
    );
    expect(result.result).toBeSome(
      expect.objectContaining({ type: expect.any(Number) })
    );
  });

  it("owner can deactivate a plan", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(10), Cl.uint(2000), Cl.uint(288), Cl.uint(1500)],
      deployer
    );
    const { result } = simnet.callPublicFn(
      "data-tracking",
      "deactivate-plan",
      [Cl.uint(10)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("subscribing to inactive plan fails", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(10), Cl.uint(2000), Cl.uint(288), Cl.uint(1500)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "deactivate-plan",
      [Cl.uint(10)],
      deployer
    );
    const { result } = simnet.callPublicFn(
      "data-tracking",
      "subscribe-to-plan",
      [Cl.uint(10), Cl.bool(false)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(107));
  });

  it("non-owner cannot deactivate a plan", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(10), Cl.uint(2000), Cl.uint(288), Cl.uint(1500)],
      deployer
    );
    const { result } = simnet.callPublicFn(
      "data-tracking",
      "deactivate-plan",
      [Cl.uint(10)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(100));
  });

  it("owner can update an existing plan", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(10), Cl.uint(2000), Cl.uint(288), Cl.uint(1500)],
      deployer
    );
    const { result } = simnet.callPublicFn(
      "data-tracking",
      "update-plan",
      [Cl.uint(10), Cl.uint(3000), Cl.uint(576), Cl.uint(2000)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("updating nonexistent plan fails", () => {
    const { result } = simnet.callPublicFn(
      "data-tracking",
      "update-plan",
      [Cl.uint(999), Cl.uint(3000), Cl.uint(576), Cl.uint(2000)],
      deployer
    );
    expect(result).toBeErr(Cl.uint(105));
  });
});
