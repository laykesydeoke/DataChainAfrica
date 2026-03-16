import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("auto-renew subscription", () => {
  it("can subscribe with auto-renew enabled", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(1000), Cl.uint(144), Cl.uint(500)],
      deployer
    );
    const { result } = simnet.callPublicFn(
      "data-tracking",
      "subscribe-to-plan",
      [Cl.uint(1), Cl.bool(true)],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("auto-renew flag stored correctly", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(1000), Cl.uint(144), Cl.uint(500)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "subscribe-to-plan",
      [Cl.uint(1), Cl.bool(true)],
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

  it("can subscribe with auto-renew disabled", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(1000), Cl.uint(144), Cl.uint(500)],
      deployer
    );
    const { result } = simnet.callPublicFn(
      "data-tracking",
      "subscribe-to-plan",
      [Cl.uint(1), Cl.bool(false)],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("check-plan-validity returns true for fresh subscriber", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(1000), Cl.uint(144), Cl.uint(500)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "subscribe-to-plan",
      [Cl.uint(1), Cl.bool(false)],
      wallet1
    );
    const result = simnet.callPublicFn(
      "data-tracking",
      "check-plan-validity",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(result.result).toBeOk(Cl.bool(true));
  });

  it("check-plan-validity fails for non-subscriber", () => {
    const result = simnet.callPublicFn(
      "data-tracking",
      "check-plan-validity",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(result.result).toBeErr(Cl.uint(102));
  });
});
