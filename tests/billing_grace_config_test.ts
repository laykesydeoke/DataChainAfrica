import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("billing grace period configuration", () => {
  it("owner can update grace period", () => {
    const result = simnet.callPublicFn(
      "billing",
      "update-grace-period",
      [Cl.uint(288)],
      deployer
    );
    expect(result.result).toBeOk(Cl.bool(true));
  });

  it("non-owner cannot update grace period", () => {
    const result = simnet.callPublicFn(
      "billing",
      "update-grace-period",
      [Cl.uint(288)],
      wallet1
    );
    expect(result.result).toBeErr(Cl.uint(200));
  });

  it("updated grace period applies to new cancellations", () => {
    simnet.callPublicFn(
      "billing",
      "update-grace-period",
      [Cl.uint(288)],
      deployer
    );
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
    simnet.callPublicFn("billing", "cancel-subscription", [], wallet1);

    const remaining = simnet.callReadOnlyFn(
      "billing",
      "get-grace-period-remaining",
      [Cl.principal(wallet1)],
      wallet1
    );
    const val = Number((remaining.result as any).value ?? 0);
    expect(val).toBeGreaterThan(100);
  });
});
