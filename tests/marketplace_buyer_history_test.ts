import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;

describe("marketplace buyer history", () => {
  it("buyer history is populated after purchase", () => {
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
      "marketplace",
      "create-listing",
      [Cl.uint(200), Cl.uint(500000), Cl.uint(100)],
      wallet1
    );
    simnet.callPublicFn(
      "marketplace",
      "purchase-listing",
      [Cl.uint(1), Cl.contractPrincipal(deployer, "data-tracking")],
      wallet2
    );

    const result = simnet.callReadOnlyFn(
      "marketplace",
      "get-user-purchases",
      [Cl.principal(wallet2)],
      wallet2
    );
    expect(result.result).toBeSome(expect.anything());
  });

  it("user with no purchases returns none", () => {
    const result = simnet.callReadOnlyFn(
      "marketplace",
      "get-user-purchases",
      [Cl.principal(wallet2)],
      wallet2
    );
    expect(result.result).toBeNone();
  });
});
