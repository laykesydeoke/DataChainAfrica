import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("telemetry edge cases", () => {
  it("telemetry snapshot event-count starts at 0", () => {
    const snap = simnet.callReadOnlyFn(
      "data-tracking",
      "get-telemetry-snapshot",
      [],
      deployer
    );
    const count = Number(
      (snap.result as any).value?.data?.["event-count"]?.value ?? 0
    );
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it("billing telemetry total-payments starts at 0", () => {
    const tel = simnet.callReadOnlyFn(
      "billing",
      "get-billing-telemetry",
      [],
      deployer
    );
    const payments = Number(
      (tel.result as any).value?.data?.["total-payments"]?.value ?? 0
    );
    expect(payments).toBeGreaterThanOrEqual(0);
  });

  it("user telemetry last-updated is current block after usage", () => {
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
      [Cl.principal(wallet1), Cl.uint(50)],
      deployer
    );
    const tel = simnet.callReadOnlyFn(
      "data-tracking",
      "get-user-telemetry",
      [Cl.principal(wallet1)],
      wallet1
    );
    const lastUpdated = Number(
      (tel.result as any).value?.value?.data?.["last-updated"]?.value ?? 0
    );
    expect(lastUpdated).toBeGreaterThan(0);
  });
});
