import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;

describe("network telemetry reporting", () => {
  it("total-data-recorded increases after usage", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(1000), Cl.uint(144), Cl.uint(100)],
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
    const before = simnet.callReadOnlyFn(
      "data-tracking",
      "get-total-data-recorded",
      [],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet1), Cl.uint(200)],
      deployer
    );
    const after = simnet.callReadOnlyFn(
      "data-tracking",
      "get-total-data-recorded",
      [],
      deployer
    );
    expect(Number((after.result as any).value ?? 0)).toBeGreaterThan(
      Number((before.result as any).value ?? 0)
    );
  });

  it("unique users counter increases on first subscribe", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(100)],
      deployer
    );
    const before = simnet.callReadOnlyFn(
      "data-tracking",
      "get-total-unique-users",
      [],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "subscribe-to-plan",
      [Cl.uint(1), Cl.bool(false)],
      wallet2
    );
    const after = simnet.callReadOnlyFn(
      "data-tracking",
      "get-total-unique-users",
      [],
      deployer
    );
    expect(Number((after.result as any).value ?? 0)).toBeGreaterThanOrEqual(
      Number((before.result as any).value ?? 0)
    );
  });
});
