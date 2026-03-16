import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("billing no-subscription edge cases", () => {
  it("renewal fails without subscription", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(100000000)],
      deployer
    );

    const result = simnet.callPublicFn(
      "billing",
      "process-renewal-payment",
      [Cl.contractPrincipal(deployer, "data-tracking")],
      wallet1
    );
    expect(result.result).toBeErr(expect.anything());
  });

  it("subscription details is none for new user", () => {
    const result = simnet.callReadOnlyFn(
      "billing",
      "get-subscription-details",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeNone();
  });

  it("is-payment-due returns false for non-subscriber", () => {
    const result = simnet.callReadOnlyFn(
      "billing",
      "is-payment-due",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeBool(false);
  });
});
