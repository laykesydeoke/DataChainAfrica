import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;

describe("buyer purchase count", () => {
  it("buyer stats start at zero", () => {
    const result = simnet.callReadOnlyFn(
      "marketplace",
      "get-buyer-stats",
      [Cl.principal(wallet2)],
      wallet2
    );
    expect(result.result).toBeTuple({
      "total-purchases": Cl.uint(0),
      "total-data-bought": Cl.uint(0),
      "total-spent": Cl.uint(0),
    });
  });

  it("buyer purchase count increments after buy", () => {
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
      [Cl.uint(300), Cl.uint(500000), Cl.uint(100)],
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
      "get-buyer-stats",
      [Cl.principal(wallet2)],
      wallet2
    );
    const stats = result.result as any;
    const purchases = Number(stats.data?.["total-purchases"]?.value ?? 0);
    expect(purchases).toBe(1);
  });
});
