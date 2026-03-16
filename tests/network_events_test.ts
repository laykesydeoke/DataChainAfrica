import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("network event counters", () => {
  it("event counter starts at zero", () => {
    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "get-latest-event-id",
      [],
      deployer
    );
    expect(result.result).toBeUint(0);
  });

  it("event counter increments on each record-usage", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(5000), Cl.uint(1000), Cl.uint(100)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "subscribe-to-plan",
      [Cl.uint(1), Cl.bool(false)],
      wallet1
    );
    simnet.callPublicFn(
      "data-tracking",
      "authorize-carrier",
      [Cl.principal(deployer)],
      deployer
    );
    for (let i = 0; i < 5; i++) {
      simnet.callPublicFn(
        "data-tracking",
        "record-usage",
        [Cl.principal(wallet1), Cl.uint(10)],
        deployer
      );
    }

    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "get-latest-event-id",
      [],
      deployer
    );
    expect(result.result).toBeUint(5);
  });
});
