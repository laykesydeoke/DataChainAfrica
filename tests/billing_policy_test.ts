import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("billing policy governance", () => {
  it("owner can update grace period", () => {
    const result = simnet.callPublicFn(
      "billing",
      "set-grace-period",
      [Cl.uint(288)],
      deployer
    );
    expect(result.result).toBeOk(Cl.bool(true));
  });

  it("non-owner cannot update grace period", () => {
    const result = simnet.callPublicFn(
      "billing",
      "set-grace-period",
      [Cl.uint(288)],
      wallet1
    );
    expect(result.result).toBeErr(Cl.uint(100));
  });

  it("owner can pause billing contract", () => {
    const result = simnet.callPublicFn(
      "billing",
      "set-paused",
      [Cl.bool(true)],
      deployer
    );
    expect(result.result).toBeOk(Cl.bool(true));
  });

  it("subscription fails when billing paused", () => {
    simnet.callPublicFn("billing", "set-paused", [Cl.bool(true)], deployer);
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(100000000)],
      deployer
    );
    const result = simnet.callPublicFn(
      "billing",
      "subscribe-and-pay",
      [
        Cl.uint(1),
        Cl.contractPrincipal(deployer, "data-tracking"),
        Cl.uint(0),
      ],
      wallet1
    );
    expect(result.result).toBeErr(Cl.uint(105));
    simnet.callPublicFn("billing", "set-paused", [Cl.bool(false)], deployer);
  });
});
