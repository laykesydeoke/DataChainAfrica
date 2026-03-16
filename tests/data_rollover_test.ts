import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("data rollover on renewal", () => {
  it("unused data rolls over on expiry renewal", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(1000), Cl.uint(5), Cl.uint(100)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "subscribe-to-plan",
      [Cl.uint(1), Cl.bool(true)],
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
      [Cl.principal(wallet1), Cl.uint(300)],
      deployer
    );

    simnet.mineEmptyBlocks(10);

    simnet.callPublicFn(
      "data-tracking",
      "process-plan-expiry",
      [Cl.principal(wallet1)],
      deployer
    );

    const data = simnet.callReadOnlyFn(
      "data-tracking",
      "get-user-data",
      [Cl.principal(wallet1)],
      wallet1
    );
    const parsed = data.result as any;
    const balance = Number(parsed.value?.data?.["data-balance"]?.value ?? 0);
    expect(balance).toBeGreaterThan(1000);
  });

  it("no rollover when auto-renew off", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(1000), Cl.uint(5), Cl.uint(100)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "subscribe-to-plan",
      [Cl.uint(1), Cl.bool(false)],
      wallet1
    );

    simnet.mineEmptyBlocks(10);

    simnet.callPublicFn(
      "data-tracking",
      "process-plan-expiry",
      [Cl.principal(wallet1)],
      deployer
    );

    const data = simnet.callReadOnlyFn(
      "data-tracking",
      "get-user-data",
      [Cl.principal(wallet1)],
      wallet1
    );
    const parsed = data.result as any;
    const balance = Number(parsed.value?.data?.["data-balance"]?.value ?? -1);
    expect(balance).toBe(0);
  });
});
