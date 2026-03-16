import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;

describe("carrier stats and network", () => {
  it("multiple carriers can be authorized", () => {
    simnet.callPublicFn(
      "data-tracking",
      "authorize-carrier",
      [Cl.principal(deployer)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "authorize-carrier",
      [Cl.principal(wallet1)],
      deployer
    );

    const auth1 = simnet.callReadOnlyFn(
      "data-tracking",
      "is-carrier-authorized",
      [Cl.principal(deployer)],
      deployer
    );
    const auth2 = simnet.callReadOnlyFn(
      "data-tracking",
      "is-carrier-authorized",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(auth1.result).toBeBool(true);
    expect(auth2.result).toBeBool(true);
  });

  it("event counter tracks across multiple records", () => {
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
      wallet2
    );
    simnet.callPublicFn(
      "data-tracking",
      "authorize-carrier",
      [Cl.principal(deployer)],
      deployer
    );

    simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet2), Cl.uint(100)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet2), Cl.uint(200)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet2), Cl.uint(300)],
      deployer
    );

    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "get-latest-event-id",
      [],
      deployer
    );
    expect(result.result).toBeUint(3);
  });

  it("total data recorded sums correctly", () => {
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
      wallet2
    );
    simnet.callPublicFn(
      "data-tracking",
      "authorize-carrier",
      [Cl.principal(deployer)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet2), Cl.uint(150)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet2), Cl.uint(250)],
      deployer
    );

    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "get-total-data-recorded",
      [],
      deployer
    );
    expect(result.result).toBeUint(400);
  });
});
