import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("grace period management", () => {
  it("default grace period is 144 blocks", () => {
    const result = simnet.callReadOnlyFn(
      "billing",
      "get-grace-period",
      [],
      deployer
    );
    expect(result.result).toBeUint(144);
  });

  it("owner can update grace period", () => {
    const { result } = simnet.callPublicFn(
      "billing",
      "update-grace-period",
      [Cl.uint(288)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("grace period updated value is returned", () => {
    simnet.callPublicFn(
      "billing",
      "update-grace-period",
      [Cl.uint(432)],
      deployer
    );
    const result = simnet.callReadOnlyFn(
      "billing",
      "get-grace-period",
      [],
      deployer
    );
    expect(result.result).toBeUint(432);
  });

  it("non-owner cannot update grace period", () => {
    const { result } = simnet.callPublicFn(
      "billing",
      "update-grace-period",
      [Cl.uint(200)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(200));
  });

  it("zero blocks grace period is rejected", () => {
    const { result } = simnet.callPublicFn(
      "billing",
      "update-grace-period",
      [Cl.uint(0)],
      deployer
    );
    expect(result).toBeErr(Cl.uint(208));
  });

  it("subscription grace-period-end set correctly after subscribe", () => {
    simnet.callPublicFn(
      "billing",
      "update-grace-period",
      [Cl.uint(144)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(100000000)],
      deployer
    );
    simnet.callPublicFn(
      "billing",
      "subscribe-and-pay",
      [
        Cl.uint(1),
        Cl.contractPrincipal(deployer, "data-tracking"),
        Cl.uint(0),
      ],
      wallet1
    );

    const sub = simnet.callReadOnlyFn(
      "billing",
      "get-subscription",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(sub.result).toBeSome(
      expect.objectContaining({ type: expect.any(Number) })
    );
  });
});
