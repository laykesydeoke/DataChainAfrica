import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;

describe("revenue in STX units", () => {
  it("revenue in STX is zero before any payments", () => {
    const result = simnet.callReadOnlyFn(
      "billing",
      "get-total-revenue-in-stx",
      [],
      deployer
    );
    expect(result.result).toBeUint(0);
  });

  it("revenue in STX grows after subscriptions", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(2000000000)],
      deployer
    );
    simnet.callPublicFn(
      "billing",
      "subscribe-and-pay",
      [
        Cl.uint(1),
        Cl.contractPrincipal(deployer, "data-tracking"),
        Cl.uint(0),
      ],
      wallet1
    );
    simnet.callPublicFn(
      "billing",
      "subscribe-and-pay",
      [
        Cl.uint(1),
        Cl.contractPrincipal(deployer, "data-tracking"),
        Cl.uint(0),
      ],
      wallet2
    );

    const result = simnet.callReadOnlyFn(
      "billing",
      "get-total-revenue-in-stx",
      [],
      deployer
    );
    expect(result.result).toBeUint(4000);
  });

  it("platform summary shows revenue", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(100000000)],
      deployer
    );
    simnet.callPublicFn(
      "billing",
      "subscribe-and-pay",
      [
        Cl.uint(1),
        Cl.contractPrincipal(deployer, "data-tracking"),
        Cl.uint(0),
      ],
      wallet1
    );

    const result = simnet.callReadOnlyFn(
      "billing",
      "get-platform-summary",
      [],
      deployer
    );
    const summary = result.result as any;
    const revenue = Number(summary.data?.["total-revenue"]?.value ?? 0);
    expect(revenue).toBeGreaterThan(0);
  });
});
