import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("marketplace admin controls", () => {
  it("owner can pause marketplace", () => {
    const { result } = simnet.callPublicFn(
      "marketplace",
      "set-paused",
      [Cl.bool(true)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("owner can unpause marketplace", () => {
    simnet.callPublicFn(
      "marketplace",
      "set-paused",
      [Cl.bool(true)],
      deployer
    );
    const { result } = simnet.callPublicFn(
      "marketplace",
      "set-paused",
      [Cl.bool(false)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("non-owner cannot pause marketplace", () => {
    const { result } = simnet.callPublicFn(
      "marketplace",
      "set-paused",
      [Cl.bool(true)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(300));
  });

  it("get-paused reflects state", () => {
    simnet.callPublicFn(
      "marketplace",
      "set-paused",
      [Cl.bool(true)],
      deployer
    );
    const result = simnet.callReadOnlyFn(
      "marketplace",
      "get-paused",
      [],
      deployer
    );
    expect(result.result).toBeBool(true);
  });

  it("fee over 10 rejected", () => {
    const { result } = simnet.callPublicFn(
      "marketplace",
      "set-platform-fee",
      [Cl.uint(11)],
      deployer
    );
    expect(result).toBeErr(Cl.uint(307));
  });

  it("purchase blocked when paused", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(5000), Cl.uint(1000), Cl.uint(500)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "subscribe-to-plan",
      [Cl.uint(1), Cl.bool(false)],
      wallet1
    );
    simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [
        Cl.uint(100),
        Cl.uint(200),
        Cl.uint(500),
        Cl.contractPrincipal(deployer, "data-tracking"),
      ],
      wallet1
    );
    simnet.callPublicFn(
      "marketplace",
      "set-paused",
      [Cl.bool(true)],
      deployer
    );

    const { result } = simnet.callPublicFn(
      "marketplace",
      "purchase-listing",
      [Cl.uint(1), Cl.contractPrincipal(deployer, "data-tracking")],
      deployer
    );
    expect(result).toBeErr(Cl.uint(306));
  });
});
