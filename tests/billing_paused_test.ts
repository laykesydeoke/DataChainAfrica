import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("billing paused state", () => {
  it("paused billing blocks subscribe-and-pay", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(100000000)],
      deployer
    );
    simnet.callPublicFn("billing", "set-paused", [Cl.bool(true)], deployer);

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
    expect(result.result).toBeErr(Cl.uint(207));
  });

  it("get-paused reflects current state", () => {
    simnet.callPublicFn("billing", "set-paused", [Cl.bool(true)], deployer);

    const result = simnet.callReadOnlyFn(
      "billing",
      "get-paused",
      [],
      deployer
    );
    expect(result.result).toBeBool(true);

    simnet.callPublicFn("billing", "set-paused", [Cl.bool(false)], deployer);
    const result2 = simnet.callReadOnlyFn(
      "billing",
      "get-paused",
      [],
      deployer
    );
    expect(result2.result).toBeBool(false);
  });
});
