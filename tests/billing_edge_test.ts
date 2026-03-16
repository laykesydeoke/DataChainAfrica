import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("billing edge cases", () => {
  it("subscribing to nonexistent plan fails", () => {
    const { result } = simnet.callPublicFn(
      "billing",
      "subscribe-and-pay",
      [
        Cl.uint(999),
        Cl.contractPrincipal(deployer, "data-tracking"),
        Cl.uint(0),
      ],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(202));
  });

  it("renewal without subscription fails", () => {
    const { result } = simnet.callPublicFn(
      "billing",
      "process-renewal-payment",
      [Cl.contractPrincipal(deployer, "data-tracking")],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(204));
  });

  it("renewal when payment not due fails", () => {
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

    const { result } = simnet.callPublicFn(
      "billing",
      "process-renewal-payment",
      [Cl.contractPrincipal(deployer, "data-tracking")],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(203));
  });

  it("cancel without subscription fails", () => {
    const { result } = simnet.callPublicFn(
      "billing",
      "cancel-subscription",
      [],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(204));
  });

  it("subscribe-and-pay paused contract fails", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(500), Cl.uint(144), Cl.uint(100000000)],
      deployer
    );
    simnet.callPublicFn(
      "billing",
      "set-paused",
      [Cl.bool(true)],
      deployer
    );
    const { result } = simnet.callPublicFn(
      "billing",
      "subscribe-and-pay",
      [
        Cl.uint(1),
        Cl.contractPrincipal(deployer, "data-tracking"),
        Cl.uint(0),
      ],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(207));
  });
});
