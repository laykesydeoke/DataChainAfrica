import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("marketplace platform fee", () => {
  it("default platform fee is 2 percent", () => {
    const result = simnet.callReadOnlyFn(
      "marketplace",
      "get-platform-fee",
      [],
      deployer
    );
    expect(result.result).toBeUint(2);
  });

  it("owner can set platform fee", () => {
    const { result } = simnet.callPublicFn(
      "marketplace",
      "set-platform-fee",
      [Cl.uint(5)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("platform fee updated correctly", () => {
    simnet.callPublicFn(
      "marketplace",
      "set-platform-fee",
      [Cl.uint(3)],
      deployer
    );
    const result = simnet.callReadOnlyFn(
      "marketplace",
      "get-platform-fee",
      [],
      deployer
    );
    expect(result.result).toBeUint(3);
  });

  it("non-owner cannot set platform fee", () => {
    const { result } = simnet.callPublicFn(
      "marketplace",
      "set-platform-fee",
      [Cl.uint(1)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(300));
  });

  it("platform fee above 10 is rejected", () => {
    const { result } = simnet.callPublicFn(
      "marketplace",
      "set-platform-fee",
      [Cl.uint(11)],
      deployer
    );
    expect(result).toBeErr(Cl.uint(307));
  });

  it("platform fee of 10 is accepted", () => {
    const { result } = simnet.callPublicFn(
      "marketplace",
      "set-platform-fee",
      [Cl.uint(10)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("platform fee of 0 is accepted", () => {
    const { result } = simnet.callPublicFn(
      "marketplace",
      "set-platform-fee",
      [Cl.uint(0)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });
});
