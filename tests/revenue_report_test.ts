import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("revenue reporting", () => {
  it("total-revenue-in-stx is 0 before any payments", () => {
    const rev = simnet.callReadOnlyFn(
      "billing",
      "get-total-revenue-in-stx",
      [],
      deployer
    );
    expect(Number((rev.result as any).value ?? 0)).toBeGreaterThanOrEqual(0);
  });

  it("total-revenue increases after subscribe-and-pay", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(100000000)],
      deployer
    );
    const before = simnet.callReadOnlyFn(
      "billing",
      "get-total-payments",
      [],
      deployer
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
      "get-total-payments",
      [],
      deployer
    );
    expect(Number((after.result as any).value ?? 0)).toBeGreaterThan(
      Number((before.result as any).value ?? 0)
    );
  });

  it("billing telemetry revenue-stx matches revenue-ustx / 1000000", () => {
    const tel = simnet.callReadOnlyFn(
      "billing",
      "get-billing-telemetry",
      [],
      deployer
    );
    const data = (tel.result as any).value?.data;
    const ustx = Number(data?.["total-revenue-ustx"]?.value ?? 0);
    const stx = Number(data?.["total-revenue-stx"]?.value ?? 0);
    expect(stx).toBe(Math.floor(ustx / 1000000));
  });
});
