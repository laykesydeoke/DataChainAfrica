import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;
const wallet3 = simnet.getAccounts().get("wallet_3")!;

describe("edge cases", () => {
  describe("billing edge cases", () => {
    it("get-payment returns none for nonexistent payment ID", () => {
      const result = simnet.callReadOnlyFn(
        "billing",
        "get-payment",
        [Cl.uint(9999)],
        deployer
      );
      expect(result.result).toBeNone();
    });

    it("get-promotional-rate returns none for nonexistent promo", () => {
      const result = simnet.callReadOnlyFn(
        "billing",
        "get-promotional-rate",
        [Cl.uint(9999)],
        deployer
      );
      expect(result.result).toBeNone();
    });

    it("is-promotion-valid returns false for nonexistent promo", () => {
      const result = simnet.callReadOnlyFn(
        "billing",
        "is-promotion-valid",
        [Cl.uint(9999)],
        deployer
      );
      expect(result.result).toBeBool(false);
    });
  });

  describe("data-tracking edge cases", () => {
    it("get-user-data returns none for user without plan", () => {
      const result = simnet.callReadOnlyFn(
        "data-tracking",
        "get-user-data",
        [Cl.principal(wallet3)],
        wallet3
      );
      expect(result.result).toBeNone();
    });

    it("get-usage-event returns none for nonexistent event", () => {
      const result = simnet.callReadOnlyFn(
        "data-tracking",
        "get-usage-event",
        [Cl.uint(9999)],
        deployer
      );
      expect(result.result).toBeNone();
    });

    it("get-latest-event-id starts at zero", () => {
      const result = simnet.callReadOnlyFn(
        "data-tracking",
        "get-latest-event-id",
        [],
        deployer
      );
      expect(result.result).toBeUint(0);
    });

    it("is-carrier-authorized returns false for unknown carrier", () => {
      const result = simnet.callReadOnlyFn(
        "data-tracking",
        "is-carrier-authorized",
        [Cl.principal(wallet3)],
        deployer
      );
      expect(result.result).toBeBool(false);
    });

    it("deactivate-plan fails for nonexistent plan", () => {
      const { result } = simnet.callPublicFn(
        "data-tracking",
        "deactivate-plan",
        [Cl.uint(9999)],
        deployer
      );
      expect(result).toBeErr(Cl.uint(105));
    });
  });

  describe("marketplace edge cases", () => {
    it("get-listing returns none for nonexistent ID", () => {
      const result = simnet.callReadOnlyFn(
        "marketplace",
        "get-listing",
        [Cl.uint(9999)],
        deployer
      );
      expect(result.result).toBeNone();
    });

    it("get-user-sales returns none for user with no listings", () => {
      const result = simnet.callReadOnlyFn(
        "marketplace",
        "get-user-sales",
        [Cl.principal(wallet3)],
        deployer
      );
      expect(result.result).toBeNone();
    });

    it("get-user-active-listings returns zero for new user", () => {
      const result = simnet.callReadOnlyFn(
        "marketplace",
        "get-user-active-listings",
        [Cl.principal(wallet3)],
        deployer
      );
      expect(result.result).toBeUint(0);
    });

    it("cancel-listing fails for nonexistent listing", () => {
      const { result } = simnet.callPublicFn(
        "marketplace",
        "cancel-listing",
        [Cl.uint(9999)],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(301));
    });

    it("purchase-listing fails for nonexistent listing", () => {
      const { result } = simnet.callPublicFn(
        "marketplace",
        "purchase-listing",
        [Cl.uint(9999), Cl.contractPrincipal(deployer, "data-tracking")],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(301));
    });
  });
});
