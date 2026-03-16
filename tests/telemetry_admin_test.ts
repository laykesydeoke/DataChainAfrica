import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("telemetry admin controls", () => {
  it("pausing contract reflects in telemetry snapshot", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-paused",
      [Cl.bool(true)],
      deployer
    );
    const snap = simnet.callReadOnlyFn(
      "data-tracking",
      "get-telemetry-snapshot",
      [],
      deployer
    );
    const paused = (snap.result as any).value?.data?.["is-paused"]?.value;
    expect(paused).toBe(true);
    simnet.callPublicFn(
      "data-tracking",
      "set-paused",
      [Cl.bool(false)],
      deployer
    );
  });

  it("pausing billing reflects in billing telemetry", () => {
    simnet.callPublicFn("billing", "set-paused", [Cl.bool(true)], deployer);
    const tel = simnet.callReadOnlyFn(
      "billing",
      "get-billing-telemetry",
      [],
      deployer
    );
    const paused = (tel.result as any).value?.data?.["is-paused"]?.value;
    expect(paused).toBe(true);
    simnet.callPublicFn("billing", "set-paused", [Cl.bool(false)], deployer);
  });

  it("grace period change reflects in billing telemetry", () => {
    simnet.callPublicFn(
      "billing",
      "set-grace-period",
      [Cl.uint(288)],
      deployer
    );
    const tel = simnet.callReadOnlyFn(
      "billing",
      "get-billing-telemetry",
      [],
      deployer
    );
    const grace = Number(
      (tel.result as any).value?.data?.["grace-period-blocks"]?.value ?? 0
    );
    expect(grace).toBe(288);
  });
});
