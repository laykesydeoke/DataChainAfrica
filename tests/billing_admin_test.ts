import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("billing admin controls", () => {
  it("owner can pause billing", () => {
    const { result } = simnet.callPublicFn(
      "billing",
      "set-paused",
      [Cl.bool(true)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("owner can unpause billing", () => {
    simnet.callPublicFn("billing", "set-paused", [Cl.bool(true)], deployer);
    const { result } = simnet.callPublicFn(
      "billing",
      "set-paused",
      [Cl.bool(false)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("non-owner cannot pause billing", () => {
    const { result } = simnet.callPublicFn(
      "billing",
      "set-paused",
      [Cl.bool(true)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(200));
  });

  it("get-paused reflects state", () => {
    simnet.callPublicFn("billing", "set-paused", [Cl.bool(true)], deployer);
    const result = simnet.callReadOnlyFn("billing", "get-paused", [], deployer);
    expect(result.result).toBeBool(true);
  });

  it("discount over 100 rejected in promo", () => {
    const { result } = simnet.callPublicFn(
      "billing",
      "set-promotional-rate",
      [Cl.uint(1), Cl.uint(101), Cl.uint(1000), Cl.uint(1)],
      deployer
    );
    expect(result).toBeErr(Cl.uint(206));
  });

  it("owner can set promotional rate with 100 discount", () => {
    const { result } = simnet.callPublicFn(
      "billing",
      "set-promotional-rate",
      [Cl.uint(1), Cl.uint(100), Cl.uint(1000), Cl.uint(1)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });
});
