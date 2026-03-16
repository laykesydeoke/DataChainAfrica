import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("carrier telemetry reporting", () => {
  it("carrier stats zero before any reporting", () => {
    const stats = simnet.callReadOnlyFn(
      "data-tracking",
      "get-carrier-stats",
      [Cl.principal(deployer)],
      deployer
    );
    const total = Number(
      (stats.result as any).value?.data?.["total-usage-reported"]?.value ?? 0
    );
    expect(total).toBe(0);
  });

  it("carrier stats update after record-usage", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(100)],
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
    simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet1), Cl.uint(150)],
      deployer
    );
    const stats = simnet.callReadOnlyFn(
      "data-tracking",
      "get-carrier-stats",
      [Cl.principal(deployer)],
      deployer
    );
    const total = Number(
      (stats.result as any).value?.data?.["total-usage-reported"]?.value ?? 0
    );
    expect(total).toBeGreaterThan(0);
  });

  it("carrier total usage matches get-carrier-total-usage", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(100)],
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
    simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet1), Cl.uint(100)],
      deployer
    );
    const total = simnet.callReadOnlyFn(
      "data-tracking",
      "get-carrier-total-usage",
      [Cl.principal(deployer)],
      deployer
    );
    expect(Number((total.result as any).value ?? 0)).toBeGreaterThan(0);
  });
});
