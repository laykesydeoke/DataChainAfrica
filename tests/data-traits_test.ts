import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("data-traits contract", () => {
  it("data-traits contract deploys successfully", () => {
    const contracts = simnet.getContractsInterfaces();
    expect(contracts.has(`${deployer}.data-traits`)).toBe(true);
  });

  it("data-tracking implements get-plan-details", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(50000000)],
      deployer
    );

    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "get-plan-details",
      [Cl.uint(1)],
      deployer
    );
    expect(result.result).toBeSome(
      expect.objectContaining({ type: expect.any(Number) })
    );
  });

  it("data-tracking implements subscribe-to-plan", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(50000000)],
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

  it("data-tracking implements get-usage", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(50000000)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "subscribe-to-plan",
      [Cl.uint(1), Cl.bool(false)],
      wallet1
    );

    const { result } = simnet.callPublicFn(
      "data-tracking",
      "get-usage",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result).toBeOk(
      expect.objectContaining({ type: expect.any(Number) })
    );
  });

  it("marketplace implements create-listing", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(5000), Cl.uint(1000), Cl.uint(50000000)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "subscribe-to-plan",
      [Cl.uint(1), Cl.bool(false)],
      wallet1
    );

    const { result } = simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [
        Cl.uint(100),
        Cl.uint(5000000),
        Cl.uint(500),
        Cl.contractPrincipal(deployer, "data-tracking"),
      ],
      wallet1
    );
    expect(result).toBeOk(Cl.uint(1));
  });

  it("marketplace implements cancel-listing", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(5000), Cl.uint(1000), Cl.uint(50000000)],
      deployer
    );
    simnet.callPublicFn(
      "data-tracking",
      "subscribe-to-plan",
      [Cl.uint(1), Cl.bool(false)],
      wallet1
    );
    simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [Cl.uint(100), Cl.uint(5000000), Cl.uint(500),
        Cl.contractPrincipal(deployer, "data-tracking")],
      wallet1
    );

    const { result } = simnet.callPublicFn(
      "marketplace",
      "cancel-listing",
      [Cl.uint(1)],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));
  });
});
