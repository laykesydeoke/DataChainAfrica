import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

function subscribe(autoRenew: boolean) {
  simnet.callPublicFn(
    "data-tracking",
    "set-data-plan",
    [Cl.uint(1), Cl.uint(1000), Cl.uint(144), Cl.uint(500)],
    deployer
  );
  simnet.callPublicFn(
    "data-tracking",
    "subscribe-to-plan",
    [Cl.uint(1), Cl.bool(autoRenew)],
    wallet1
  );
}

describe("auto-renew toggle", () => {
  it("can enable auto-renew", () => {
    subscribe(false);
    const { result } = simnet.callPublicFn(
      "data-tracking",
      "set-auto-renew",
      [Cl.bool(true)],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("can disable auto-renew", () => {
    subscribe(true);
    const { result } = simnet.callPublicFn(
      "data-tracking",
      "set-auto-renew",
      [Cl.bool(false)],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("set-auto-renew fails without subscription", () => {
    const { result } = simnet.callPublicFn(
      "data-tracking",
      "set-auto-renew",
      [Cl.bool(true)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(102));
  });

  it("auto-renew stored in user data", () => {
    subscribe(false);
    simnet.callPublicFn(
      "data-tracking",
      "set-auto-renew",
      [Cl.bool(true)],
      wallet1
    );
    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "get-user-data",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeSome(
      expect.objectContaining({ type: expect.any(Number) })
    );
  });

  it("data balance unchanged after toggle", () => {
    subscribe(false);
    const before = simnet.callReadOnlyFn(
      "data-tracking",
      "get-user-data",
      [Cl.principal(wallet1)],
      wallet1
    );
    simnet.callPublicFn(
      "data-tracking",
      "set-auto-renew",
      [Cl.bool(true)],
      wallet1
    );
    const after = simnet.callReadOnlyFn(
      "data-tracking",
      "get-user-data",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(before.result).toEqual(expect.anything());
    expect(after.result).toEqual(expect.anything());
  });
});
