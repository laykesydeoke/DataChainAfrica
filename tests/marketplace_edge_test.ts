import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;

describe("marketplace edge cases", () => {
  it("purchase nonexistent listing fails", () => {
    const { result } = simnet.callPublicFn(
      "marketplace",
      "purchase-listing",
      [Cl.uint(999), Cl.contractPrincipal(deployer, "data-tracking")],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(301));
  });

  it("cancel nonexistent listing fails", () => {
    const { result } = simnet.callPublicFn(
      "marketplace",
      "cancel-listing",
      [Cl.uint(999)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(301));
  });

  it("extend nonexistent listing fails", () => {
    const { result } = simnet.callPublicFn(
      "marketplace",
      "extend-listing-duration",
      [Cl.uint(999), Cl.uint(100)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(301));
  });

  it("update price of nonexistent listing fails", () => {
    const { result } = simnet.callPublicFn(
      "marketplace",
      "update-listing-price",
      [Cl.uint(999), Cl.uint(100)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(301));
  });

  it("listing with insufficient data balance fails", () => {
    simnet.callPublicFn(
      "data-tracking",
      "set-data-plan",
      [Cl.uint(1), Cl.uint(50), Cl.uint(1000), Cl.uint(500)],
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
        Cl.uint(200),
        Cl.uint(500),
        Cl.contractPrincipal(deployer, "data-tracking"),
      ],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(302));
  });

  it("user with no data subscription cannot list", () => {
    const { result } = simnet.callPublicFn(
      "marketplace",
      "create-listing",
      [
        Cl.uint(100),
        Cl.uint(200),
        Cl.uint(500),
        Cl.contractPrincipal(deployer, "data-tracking"),
      ],
      wallet2
    );
    expect(result).toBeErr(Cl.uint(302));
  });
});
