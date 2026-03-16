# Data Plans Reference

DataChain Africa supports configurable data plans managed on-chain by the contract owner.

## Plan Structure

Each plan is stored in the `data-plans` map with the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `data-amount` | uint | Data quota in MB |
| `duration-blocks` | uint | Plan validity in Stacks blocks (~1 block/10min) |
| `price` | uint | Cost in microSTX (1 STX = 1,000,000 μSTX) |
| `is-active` | bool | Whether new subscriptions can use this plan |

## Block-to-Time Conversion

Stacks produces approximately 1 block every 10 minutes:
- 144 blocks ≈ 1 day
- 1008 blocks ≈ 1 week
- 4320 blocks ≈ 1 month

## Default Plan Suggestions

| Plan Name | Data | Duration | Suggested Price |
|-----------|------|----------|----------------|
| Daily | 500 MB | 144 blocks | 50,000,000 μSTX (50 STX) |
| Weekly | 3 GB | 1008 blocks | 250,000,000 μSTX (250 STX) |
| Monthly | 15 GB | 4320 blocks | 800,000,000 μSTX (800 STX) |

## Admin Operations

### Creating a Plan
```clarity
(set-data-plan plan-id data-amount duration-blocks price)
```
Only the contract owner can create plans. Each call increments the `plan-counter`.

### Updating a Plan
```clarity
(update-plan plan-id data-amount duration-blocks price)
```
Updates the price or quota of an existing plan. Does not change the `plan-counter`.

### Deactivating a Plan
```clarity
(deactivate-plan plan-id)
```
Sets `is-active` to `false`. Existing subscribers keep their current plan; no new subscriptions will use it.

### Querying Plans
```clarity
(get-plan-details plan-id) → (optional { data-amount, duration-blocks, price, is-active })
(get-total-plans) → uint
```

## Rollover Behavior

When a user's plan expires and they have unused data:
- If `auto-renew: true`: unused balance carries over as `rollover-data`
- If `auto-renew: false`: balance resets to 0

Rollover data is added to the new plan's quota:
```clarity
data-balance = plan-data-amount + rollover-data
```

## Subscription Trait

The `data-tracking-trait` exposes `subscribe-to-plan` and `get-plan-details` for cross-contract use, allowing billing.clar to validate plan prices before processing payments.
