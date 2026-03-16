import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("billing promotional rates", () => {
  it("promo is valid when within validity period", () => {
    simnet.callPublicFn(
      "billing",
      "set-promotional-rate",
      [Cl.uint(1), Cl.uint(10), Cl.uint(simnet.blockHeight + 500), Cl.uint(1)],
      deployer
    );

    const result = simnet.callReadOnlyFn(
      "billing",
      "is-promotion-valid",
      [Cl.uint(1)],
      deployer
    );
    expect(result.result).toBeBool(true);
  });

  it("promo is invalid after expiry", () => {
    simnet.callPublicFn(
      "billing",
      "set-promotional-rate",
      [Cl.uint(1), Cl.uint(10), Cl.uint(simnet.blockHeight + 1), Cl.uint(1)],
      deployer
    );
    simnet.mineEmptyBlocks(5);

    const result = simnet.callReadOnlyFn(
      "billing",
      "is-promotion-valid",
      [Cl.uint(1)],
      deployer
    );
    expect(result.result).toBeBool(false);
  });

  it("non-owner cannot set promotional rate", () => {
    const result = simnet.callPublicFn(
      "billing",
      "set-promotional-rate",
      [Cl.uint(1), Cl.uint(10), Cl.uint(simnet.blockHeight + 100), Cl.uint(1)],
      wallet1
    );
    expect(result.result).toBeErr(Cl.uint(200));
  });
});
