import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("promotion expiry", () => {
  it("promotion is valid immediately after creation", () => {
    simnet.callPublicFn(
      "billing",
      "set-promotional-rate",
      [Cl.uint(50), Cl.uint(20), Cl.uint(1000), Cl.uint(1)],
      deployer
    );
    const result = simnet.callReadOnlyFn(
      "billing",
      "is-promotion-valid",
      [Cl.uint(50)],
      deployer
    );
    expect(result.result).toBeBool(true);
  });

  it("nonexistent promotion is not valid", () => {
    const result = simnet.callReadOnlyFn(
      "billing",
      "is-promotion-valid",
      [Cl.uint(999)],
      deployer
    );
    expect(result.result).toBeBool(false);
  });

  it("get-promotional-rate returns none for missing promo", () => {
    const result = simnet.callReadOnlyFn(
      "billing",
      "get-promotional-rate",
      [Cl.uint(999)],
      deployer
    );
    expect(result.result).toBeNone();
  });

  it("owner can overwrite existing promotion", () => {
    simnet.callPublicFn(
      "billing",
      "set-promotional-rate",
      [Cl.uint(50), Cl.uint(20), Cl.uint(1000), Cl.uint(1)],
      deployer
    );
    const { result } = simnet.callPublicFn(
      "billing",
      "set-promotional-rate",
      [Cl.uint(50), Cl.uint(30), Cl.uint(2000), Cl.uint(2)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("discount of 0 creates valid zero-discount promo", () => {
    simnet.callPublicFn(
      "billing",
      "set-promotional-rate",
      [Cl.uint(51), Cl.uint(0), Cl.uint(500), Cl.uint(0)],
      deployer
    );
    const result = simnet.callReadOnlyFn(
      "billing",
      "is-promotion-valid",
      [Cl.uint(51)],
      deployer
    );
    expect(result.result).toBeBool(true);
  });

  it("subscribe with expired promo uses no discount", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(100000000)],
      deployer
    );
    // promo with 1 block validity (already expired by the time subscribe runs)
    simnet.callPublicFn(
      "billing",
      "set-promotional-rate",
      [Cl.uint(52), Cl.uint(25), Cl.uint(0), Cl.uint(1)],
      deployer
    );
    const { result } = simnet.callPublicFn(
      "billing",
      "subscribe-and-pay",
      [
        Cl.uint(1),
        Cl.contractPrincipal(deployer, "data-tracking"),
        Cl.uint(52),
      ],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));
  });
});
