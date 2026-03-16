import { initSimnet } from "@hirosystems/clarinet-sdk";

const simnet = await initSimnet();

export { simnet };

/**
 * Helper: set up a data plan and subscribe a wallet
 */
export function setupBillingSubscription(
  planId: number,
  price: number,
  subscriber: string
) {
  const { Cl } = require("@stacks/transactions");
  const deployer = simnet.deployer;

  simnet.callPublicFn(
    "data-tracking",
    "set-data-plan",
    [Cl.uint(planId), Cl.uint(500), Cl.uint(144), Cl.uint(price)],
    deployer
  );

  simnet.callPublicFn(
    "billing",
    "subscribe-and-pay",
    [
      Cl.uint(planId),
      Cl.contractPrincipal(deployer, "data-tracking"),
      Cl.uint(0),
    ],
    subscriber
  );
}

/**
 * Helper: create a marketplace listing
 */
export function createMarketListing(
  seller: string,
  dataAmount: number,
  price: number,
  duration: number
) {
  const { Cl } = require("@stacks/transactions");
  const deployer = simnet.deployer;

  return simnet.callPublicFn(
    "marketplace",
    "create-listing",
    [
      Cl.uint(dataAmount),
      Cl.uint(price),
      Cl.uint(duration),
      Cl.contractPrincipal(deployer, "data-tracking"),
    ],
    seller
  );
}

/**
export function setupPlanAndSubscribe(
  planId: number,
  dataAmount: number,
  durationBlocks: number,
  price: number,
  subscriber: string
) {
  const { Cl } = require("@stacks/transactions");
  const deployer = simnet.deployer;

  simnet.callPublicFn(
    "data-tracking",
    "set-data-plan",
    [
      Cl.uint(planId),
      Cl.uint(dataAmount),
      Cl.uint(durationBlocks),
      Cl.uint(price),
    ],
    deployer
  );

  simnet.callPublicFn(
    "data-tracking",
    "subscribe-to-plan",
    [Cl.uint(planId), Cl.bool(false)],
    subscriber
  );
}
