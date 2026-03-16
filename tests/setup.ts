import { initSimnet } from "@hirosystems/clarinet-sdk";

const simnet = await initSimnet();

export { simnet };

/**
 * Helper: set up a data plan and subscribe a wallet
 */
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
