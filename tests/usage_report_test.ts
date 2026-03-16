import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("usage report functions", () => {
  it("get-user-telemetry returns correct balance after usage", () => {
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
      [Cl.principal(wallet1), Cl.uint(200)],
      deployer
    );
    const tel = simnet.callReadOnlyFn(
      "data-tracking",
      "get-user-telemetry",
      [Cl.principal(wallet1)],
      wallet1
    );
    const balance = Number(
      (tel.result as any).value?.value?.data?.["data-balance"]?.value ?? 0
    );
    expect(balance).toBe(300);
  });

  it("get-user-telemetry reflects cumulative data-used", () => {
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
    simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet1), Cl.uint(100)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "record-usage",
      [Cl.principal(wallet1), Cl.uint(150)],
      deployer
    );
    const tel = simnet.callReadOnlyFn(
      "data-tracking",
      "get-user-telemetry",
      [Cl.principal(wallet1)],
      wallet1
    );
    const used = Number(
      (tel.result as any).value?.value?.data?.["total-data-used"]?.value ?? 0
    );
    expect(used).toBe(250);
  });
});
