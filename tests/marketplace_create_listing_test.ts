import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("marketplace create listing", () => {
  it("create listing returns listing id", () => {
    const result = simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [Cl.uint(500), Cl.uint(1000000), Cl.uint(100)],
      wallet1
    );
    expect(result.result).toBeOk(Cl.uint(1));
  });

  it("listing is active immediately after creation", () => {
    simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [Cl.uint(500), Cl.uint(1000000), Cl.uint(100)],
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

  it("listing with zero data amount is rejected", () => {
    const result = simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [Cl.uint(0), Cl.uint(1000000), Cl.uint(100)],
      wallet1
    );
    expect(result.result).toBeErr(expect.anything());
  });
});
