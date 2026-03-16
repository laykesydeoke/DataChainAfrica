import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("data-tracking admin controls", () => {
  it("owner can pause data-tracking", () => {
    const { result } = simnet.callPublicFn(
      "data-tracking",
      "set-paused",
      [Cl.bool(true)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("owner can unpause data-tracking", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-paused",
      [Cl.bool(true)],
      deployer
    );
    const { result } = simnet.callPublicFn(
      "data-tracking",
      "set-paused",
      [Cl.bool(false)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("non-owner cannot pause data-tracking", () => {
    const { result } = simnet.callPublicFn(
      "data-tracking",
      "set-paused",
      [Cl.bool(true)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(100));
  });

  it("subscribe-to-plan blocked when paused", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(1000), Cl.uint(144), Cl.uint(500)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "set-paused",
      [Cl.bool(true)],
      deployer
    );
    const { result } = simnet.callPublicFn(
      "data-tracking",
      "subscribe-to-plan",
      [Cl.uint(1), Cl.bool(false)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(106));
  });

  it("non-owner cannot authorize carrier", () => {
    const { result } = simnet.callPublicFn(
      "data-tracking",
      "authorize-carrier",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(100));
  });

  it("non-owner cannot revoke carrier", () => {
    simnet.callPublicFn(
      "data-tracking",
      "authorize-carrier",
      [Cl.principal(wallet1)],
      deployer
    );
    const { result } = simnet.callPublicFn(
      "data-tracking",
      "revoke-carrier",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(100));
  });

  it("non-owner cannot create data plan", () => {
    const { result } = simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(99), Cl.uint(500), Cl.uint(144), Cl.uint(500)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(100));
  });
});
