# Data Plan Types

DataChain Africa supports three plan categories, each configurable by the contract owner.

## Plan Structure

Each plan is stored on-chain with:

```clarity
{
  data-amount: uint,       ;; megabytes included
  duration-blocks: uint,   ;; how long the plan lasts
  price: uint,             ;; cost in microSTX
  is-active: bool          ;; can new users subscribe?
}
```

## Standard Plans

| Plan | ID | Data | Duration | Approx. Time |
|------|----|------|----------|--------------|
| Daily | 1 | 500 MB | 144 blocks | ~24 hours |
| Weekly | 2 | 2 GB | 1,008 blocks | ~7 days |
| Monthly | 3 | 5 GB | 4,320 blocks | ~30 days |

> Block time on Stacks is approximately 10 minutes.

## Creating a Plan

```clarity
(contract-call? .data-tracking set-data-plan
  u1          ;; plan-id
  u500        ;; 500 MB
  u144        ;; 144 blocks (~24h)
  u100000000  ;; 100 STX in microSTX
)
```

## Updating a Plan

```clarity
(contract-call? .data-tracking update-plan
  u1          ;; plan-id
  u600        ;; new data amount
  u144        ;; same duration
  u90000000   ;; lower price
)
```

## Deactivating a Plan

```clarity
(contract-call? .data-tracking deactivate-plan u1)
```

Deactivated plans cannot accept new subscribers but existing subscriptions remain valid.

## Auto-Renew

Users can enable auto-renew when subscribing:

```clarity
(contract-call? .data-tracking subscribe-to-plan u1 true)
;;                                                   ^-- auto-renew = true
```

When the plan expires and auto-renew is on, remaining balance rolls over to the next period.

## Data Rollover

If a user's plan expires with unused data:
- Auto-renew on: unused data is added to the new period's allocation
- Auto-renew off: balance is zeroed out

## Subscription Lifecycle

```
subscribe-to-plan
       ↓
  [active plan]
       ↓
 record-usage (carrier reports)
       ↓
  [balance decreases]
       ↓
 plan-expiry reached
       ↓
process-plan-expiry
  ├── auto-renew=true → new period begins, data rolls over
  └── auto-renew=false → plan ends, balance = 0
```
