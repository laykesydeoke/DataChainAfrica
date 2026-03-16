import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("billing cancel and renewal sequence", () => {
  it("cannot cancel non-existent subscription", () => {
    const result = simnet.callPublicFn(
      "billing",
      "cancel-subscription",
      [],
      wallet1
    );
    expect(result.result).toBeErr(Cl.uint(204));
  });

  it("cannot cancel already-cancelled subscription", () => {
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
    simnet.callPublicFn("billing", "cancel-subscription", [], wallet1);

    const result = simnet.callPublicFn(
      "billing",
      "cancel-subscription",
      [],
      wallet1
    );
    expect(result.result).toBeErr(Cl.uint(209));
  });

  it("renewal within grace succeeds", () => {
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
    simnet.callPublicFn("billing", "cancel-subscription", [], wallet1);

    const result = simnet.callPublicFn(
      "billing",
      "process-renewal-payment",
      [Cl.contractPrincipal(deployer, "data-tracking")],
      wallet1
    );
    expect(result.result).toBeOk(Cl.bool(true));
  });
});
