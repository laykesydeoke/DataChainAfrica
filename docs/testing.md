# Testing Guide

DataChain Africa uses the Clarinet SDK with Vitest for contract testing.

## Setup

```bash
npm install
```

## Running Tests

### All tests
```bash
npm test
```

### By contract
```bash
npm run test:billing        # Billing contract tests
npm run test:tracking       # Data tracking tests
npm run test:marketplace    # Marketplace tests
```

### Analytics test groups
```bash
npm run test:analytics   # Revenue, network, buyer stats
npm run test:stats       # Marketplace stats, subscription analytics
npm run test:history     # Payment history, grace period
```

### Watch mode
```bash
npm run test:watch
```

## Test Environment

Tests run inside `vitest-environment-clarinet`, which boots a local Clarinet simnet with:
- Contracts deployed from `Clarinet.toml`
- A `deployer` account with owner privileges
- `wallet_1` through `wallet_9` as test users

The simnet resets between test files (not between `it` blocks in the same file).

## Test File Organization

| File | Focus |
|------|-------|
| `billing_test.ts` | Subscribe, renew, admin |
| `data-tracking_test.ts` | Plans, usage, carriers |
| `marketplace_test.ts` | Listings, purchases, fees |
| `data-traits_test.ts` | Trait compliance |
| `integration_test.ts` | Full user journey |
| `edge_cases_test.ts` | Boundary conditions |
| `carrier_test.ts` | Carrier auth flows |
| `promo_test.ts` | Promotional rate flows |
| `rollover_test.ts` | Data rollover |
| `buyer_stats_test.ts` | Buyer history tracking |
| `revenue_tracking_test.ts` | Billing revenue stats |
| `network_stats_test.ts` | Network summary |
| `marketplace_stats_test.ts` | Platform stats |
| `subscription_analytics_test.ts` | Subscription counters |
| `payment_history_test.ts` | Payment records |
| `grace_period_test.ts` | Grace period config |
| `platform_fee_test.ts` | Fee configuration |
| `listing_lifecycle_test.ts` | Create/cancel/buy |
| `usage_events_test.ts` | Event log |
| `plan_management_test.ts` | Plan CRUD |
| `contract_paused_test.ts` | Pause protection |

## Writing New Tests

```typescript
import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("my feature", () => {
  it("does something", () => {
    const { result } = simnet.callPublicFn(
      "contract-name",
      "function-name",
      [Cl.uint(1)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });
});
```

## Clarity Assertion Helpers

| Matcher | Use |
|---------|-----|
| `toBeOk(value)` | `(ok value)` response |
| `toBeErr(uint)` | `(err u...)` response |
| `toBeSome(value)` | `(some value)` optional |
| `toBeNone()` | `none` optional |
| `toBeUint(n)` | uint literal |
| `toBeBool(b)` | bool literal |
| `toBeTuple(obj)` | tuple matching |
