import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("billing summary reporting", () => {
  it("platform-summary returns billing aggregates", () => {
    const summary = simnet.callReadOnlyFn(
      "billing",
      "get-platform-summary",
      [],
      deployer
    );
    expect(summary.result).not.toBeNone();
  });

  it("billing telemetry grace-period-blocks matches set-grace-period", () => {
    simnet.callPublicFn(
      "billing",
      "set-grace-period",
      [Cl.uint(200)],
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
    expect(grace).toBe(200);
  });

  it("billing summary total-revenue-ustx is non-negative", () => {
    const tel = simnet.callReadOnlyFn(
      "billing",
      "get-billing-telemetry",
      [],
      deployer
    );
    const rev = Number(
      (tel.result as any).value?.data?.["total-revenue-ustx"]?.value ?? 0
    );
    expect(rev).toBeGreaterThanOrEqual(0);
  });
});
