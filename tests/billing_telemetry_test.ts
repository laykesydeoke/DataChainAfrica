import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("billing telemetry reporting", () => {
  it("billing telemetry returns all fields", () => {
    const tel = simnet.callReadOnlyFn(
      "billing",
      "get-billing-telemetry",
      [],
      deployer
    );
    const data = (tel.result as any).value?.data;
    expect(data?.["total-payments"]).toBeDefined();
    expect(data?.["total-revenue-ustx"]).toBeDefined();
    expect(data?.["total-revenue-stx"]).toBeDefined();
    expect(data?.["is-paused"]).toBeDefined();
    expect(data?.["grace-period-blocks"]).toBeDefined();
  });

  it("total-payments increases after subscribe-and-pay", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(100000000)],
      deployer
    );
    const before = simnet.callReadOnlyFn(
      "billing",
      "get-billing-telemetry",
      [],
      deployer
    );
    const beforePayments = Number(
      (before.result as any).value?.data?.["total-payments"]?.value ?? 0
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
    const after = simnet.callReadOnlyFn(
      "billing",
      "get-billing-telemetry",
      [],
      deployer
    );
    const afterPayments = Number(
      (after.result as any).value?.data?.["total-payments"]?.value ?? 0
    );
    expect(afterPayments).toBeGreaterThan(beforePayments);
  });
});
