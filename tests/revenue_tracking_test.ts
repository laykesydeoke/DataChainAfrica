import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("revenue tracking", () => {
  it("total revenue starts at zero", () => {
    const result = simnet.callReadOnlyFn(
      "billing",
      "get-total-revenue",
      [],
      deployer
    );
    expect(result.result).toBeUint(0);
  });

  it("total subscribers starts at zero", () => {
    const result = simnet.callReadOnlyFn(
      "billing",
      "get-total-subscribers",
      [],
      deployer
    );
    expect(result.result).toBeUint(0);
  });

  it("user payment count starts at zero", () => {
    const result = simnet.callReadOnlyFn(
      "billing",
      "get-user-payment-count",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeUint(0);
  });

  it("platform summary has correct keys", () => {
    const result = simnet.callReadOnlyFn(
      "billing",
      "get-platform-summary",
      [],
      deployer
    );
    expect(result.result).toBeTuple({
      "total-revenue": Cl.uint(0),
      "total-subscribers": Cl.uint(0),
      "total-payments": Cl.uint(0),
    });
  });

  it("revenue increments after subscribe-and-pay", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(100000000)],
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

    const result = simnet.callReadOnlyFn(
      "billing",
      "get-total-revenue",
      [],
      deployer
    );
    expect(result.result).toBeUint(100000000);
  });

  it("subscriber count increments after subscribe-and-pay", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(100000000)],
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

    const result = simnet.callReadOnlyFn(
      "billing",
      "get-total-subscribers",
      [],
      deployer
    );
    expect(result.result).toBeUint(1);
  });

  it("user payment count increments after subscribe-and-pay", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(100000000)],
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

    const result = simnet.callReadOnlyFn(
      "billing",
      "get-user-payment-count",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeUint(1);
  });
});
