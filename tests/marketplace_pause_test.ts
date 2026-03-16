import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("marketplace pause protection", () => {
  it("paused marketplace blocks create-listing", () => {
    simnet.callPublicFn(
      "marketplace",
      "set-paused",
      [Cl.bool(true)],
      deployer
    );

    const result = simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [Cl.uint(500), Cl.uint(1000000), Cl.uint(100)],
      wallet1
    );
    expect(result.result).toBeErr(expect.anything());
  });

  it("marketplace unpauses correctly", () => {
    simnet.callPublicFn(
      "marketplace",
      "set-paused",
      [Cl.bool(true)],
      deployer
    );
    simnet.callPublicFn(
      "marketplace",
      "set-paused",
      [Cl.bool(false)],
      deployer
    );

    const paused = simnet.callReadOnlyFn(
      "marketplace",
      "get-paused",
      [],
      deployer
    );
    expect(paused.result).toBeBool(false);
  });

  it("non-owner cannot pause marketplace", () => {
    const result = simnet.callPublicFn(
      "marketplace",
      "set-paused",
      [Cl.bool(true)],
      wallet1
    );
    expect(result.result).toBeErr(expect.anything());
  });
});
