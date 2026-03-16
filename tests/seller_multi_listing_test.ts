import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;

describe("seller multiple listings", () => {
  it("seller can create multiple listings", () => {
    simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [Cl.uint(100), Cl.uint(200000), Cl.uint(50)],
      wallet1
    );
    simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [Cl.uint(200), Cl.uint(400000), Cl.uint(50)],
      wallet1
    );

    const result = simnet.callReadOnlyFn(
      "marketplace",
      "get-user-active-listings",
      [Cl.principal(wallet1)],
      wallet1
    );
    const count = Number((result.result as any).value ?? 0);
    expect(count).toBe(2);
  });

  it("cancelling reduces active listing count", () => {
    simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [Cl.uint(100), Cl.uint(200000), Cl.uint(50)],
      wallet1
    );
    simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [Cl.uint(200), Cl.uint(400000), Cl.uint(50)],
      wallet1
    );
    simnet.callPublicFn("marketplace", "cancel-listing", [Cl.uint(1)], wallet1);

    const result = simnet.callReadOnlyFn(
      "marketplace",
      "get-user-active-listings",
      [Cl.principal(wallet1)],
      wallet1
    );
    const count = Number((result.result as any).value ?? 0);
    expect(count).toBe(1);
  });
});
