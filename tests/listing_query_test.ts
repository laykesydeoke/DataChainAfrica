import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("listing query functions", () => {
  it("get-listing returns listing data", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(5000), Cl.uint(1000), Cl.uint(500)],
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
      [
        Cl.uint(200),
        Cl.uint(400),
        Cl.uint(500),
        Cl.contractPrincipal(deployer, "data-tracking"),
      ],
      wallet1
    );

    const result = simnet.callReadOnlyFn(
      "marketplace",
      "get-listing",
      [Cl.uint(1)],
      deployer
    );
    expect(result.result).toBeSome(
      expect.objectContaining({ type: expect.any(Number) })
    );
  });

  it("get-listing returns none for missing", () => {
    const result = simnet.callReadOnlyFn(
      "marketplace",
      "get-listing",
      [Cl.uint(999)],
      deployer
    );
    expect(result.result).toBeNone();
  });

  it("is-listing-active true for fresh listing", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(5000), Cl.uint(1000), Cl.uint(500)],
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
      [
        Cl.uint(200),
        Cl.uint(400),
        Cl.uint(500),
        Cl.contractPrincipal(deployer, "data-tracking"),
      ],
      wallet1
    );

    const result = simnet.callReadOnlyFn(
      "marketplace",
      "is-listing-active",
      [Cl.uint(1)],
      deployer
    );
    expect(result.result).toBeBool(true);
  });

  it("get-user-sales returns seller data", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(5000), Cl.uint(1000), Cl.uint(500)],
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
      [
        Cl.uint(200),
        Cl.uint(400),
        Cl.uint(500),
        Cl.contractPrincipal(deployer, "data-tracking"),
      ],
      wallet1
    );

    const result = simnet.callReadOnlyFn(
      "marketplace",
      "get-user-sales",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeSome(
      expect.objectContaining({ type: expect.any(Number) })
    );
  });

  it("get-user-sales returns none for no listings", () => {
    const result = simnet.callReadOnlyFn(
      "marketplace",
      "get-user-sales",
      [Cl.principal(deployer)],
      deployer
    );
    expect(result.result).toBeNone();
  });
});
