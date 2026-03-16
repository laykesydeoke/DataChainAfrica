import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("report export readiness", () => {
  it("all telemetry fields are readable in one call", () => {
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
    const snap = simnet.callReadOnlyFn(
      "data-tracking",
      "get-telemetry-snapshot",
      [],
      deployer
    );
    const tel = simnet.callReadOnlyFn(
      "billing",
      "get-billing-telemetry",
      [],
      deployer
    );
    const userTel = simnet.callReadOnlyFn(
      "data-tracking",
      "get-user-telemetry",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(snap.result).not.toBeNone();
    expect(tel.result).not.toBeNone();
    expect(userTel.result).not.toBeNone();
  });

  it("marketplace summary is readable for report export", () => {
    const summary = simnet.callReadOnlyFn(
      "marketplace",
      "get-marketplace-summary",
      [],
      deployer
    );
    expect(summary.result).not.toBeNone();
  });
});
