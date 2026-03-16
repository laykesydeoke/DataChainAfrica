import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("full telemetry reporting flow", () => {
  it("end-to-end telemetry after subscribe, use, expire", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(3), Cl.uint(100)],
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
    simnet.mineEmptyBlocks(5);
    const snap = simnet.callReadOnlyFn(
      "data-tracking",
      "get-telemetry-snapshot",
      [],
      deployer
    );
    const recorded = Number(
      (snap.result as any).value?.data?.["total-data-recorded"]?.value ?? 0
    );
    expect(recorded).toBeGreaterThan(0);

    const tel = simnet.callReadOnlyFn(
      "data-tracking",
      "get-user-telemetry",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(tel.result).not.toBeNone();
  });
});
