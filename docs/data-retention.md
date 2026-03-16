# Data Retention Policy

DataChain Africa maintains all usage data immutably on the Stacks blockchain.

## What Is Retained

| Data Type | Retention | Accessible Via |
|-----------|-----------|----------------|
| Usage events | Permanent | `get-usage-event` |
| Payment history | Permanent | `get-payment-details` |
| Carrier stats | Permanent | `get-carrier-stats` |
| User balances | Until overwritten | `get-user-data` |
| Subscription state | Until overwritten | `has-active-subscription` |

## Immutability Guarantees

Once recorded on-chain, usage events and payment records cannot be:
- Deleted
- Modified
- Backdated

This provides tamper-proof records for auditors and regulators.

## Plan Expiry vs Data Deletion

Plan expiry does **not** delete usage history. When a plan expires:
- `data-balance` is reset to `0`
- `plan-expiry` block is updated
- All prior `usage-events` remain accessible

## Carrier Data

Carrier performance data accumulates across subscription periods:
- `total-usage-reported` — aggregate, never reset
- `total-events` — aggregate event count
- `last-report-block` — updated on each report

## User Rights

Per NDPC guidelines, users can:
- View their own on-chain records (public read-only)
- Request off-chain data deletion from the operator
- Withdraw consent by cancelling subscription

On-chain data cannot be deleted — this is a feature, not a limitation.
