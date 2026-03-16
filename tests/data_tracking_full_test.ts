import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("data-tracking full contract test", () => {
  it("full subscribe, record, renew cycle", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(5), Cl.uint(100)],
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
      [Cl.principal(wallet1), Cl.uint(200)],
      deployer
    );

    simnet.mineEmptyBlocks(10);

    const expire = simnet.callPublicFn(
      "data-tracking",
      "process-plan-expiry",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(expire.result).toBeOk(Cl.bool(true));

    const data = simnet.callReadOnlyFn(
      "data-tracking",
      "get-user-data",
      [Cl.principal(wallet1)],
      wallet1
    );
    const balance = Number(
      (data.result as any).value?.data?.["data-balance"]?.value ?? 0
    );
    expect(balance).toBeGreaterThan(0);
  });
});
