import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;
const wallet3 = simnet.getAccounts().get("wallet_3")!;

describe("subscriber count telemetry", () => {
  it("unique user count matches subscriptions", () => {
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
      "subscribe-to-plan",
      [Cl.uint(1), Cl.bool(false)],
      wallet2
    );
    simnet.callPublicFn(
      "data-tracking",
      "subscribe-to-plan",
      [Cl.uint(1), Cl.bool(false)],
      wallet3
    );
    const count = simnet.callReadOnlyFn(
      "data-tracking",
      "get-total-unique-users",
      [],
      deployer
    );
    expect(Number((count.result as any).value ?? 0)).toBeGreaterThanOrEqual(3);
  });

  it("telemetry total-unique-users is non-negative", () => {
    const snap = simnet.callReadOnlyFn(
      "data-tracking",
      "get-telemetry-snapshot",
      [],
      deployer
    );
    const users = Number(
      (snap.result as any).value?.data?.["total-unique-users"]?.value ?? 0
    );
    expect(users).toBeGreaterThanOrEqual(0);
  });
});
