import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;

describe("marketplace user sales tracking", () => {
  it("user-sales shows zero for new user", () => {
    const result = simnet.callReadOnlyFn(
      "marketplace",
      "get-user-sales",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeNone();
  });

  it("user-sales is populated after creating a listing", () => {
    simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [Cl.uint(500), Cl.uint(1000000), Cl.uint(100)],
      wallet1
    );

    const result = simnet.callReadOnlyFn(
      "marketplace",
      "get-user-sales",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeSome(expect.anything());
  });
});
