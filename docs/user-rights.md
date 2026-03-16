# User Rights and Data Access

## Rights Under DataChain Africa

Users interacting with DataChain Africa's smart contracts have the following rights:

### Transparency Rights

All contract logic is open-source and deployed on the public Stacks blockchain:
- View your subscription status: `has-active-subscription`
- View your data balance: `get-user-data`
- View plan details: `get-data-plan`
- View your payment history: iterate `get-payment-details`

### Control Rights

Users maintain direct control over their subscriptions:

```clarity
;; Cancel subscription at any time
(contract-call? .data-tracking cancel-subscription)

;; Toggle auto-renewal
(contract-call? .data-tracking set-auto-renew false)
```

### Portability

All on-chain data is accessible to any indexer or analytics tool that reads the Stacks blockchain. Users can export their full history using any Stacks explorer.

## Data Minimisation

Only the following user data is stored on-chain:
- Principal address (public key hash)
- Plan ID, balance, expiry block
- Auto-renew preference
- Total data consumed (aggregate)

No personal identifiable information (PII) such as name, phone number, or location is stored on-chain.

## Consent Mechanism

By calling `subscribe-to-plan`, users explicitly consent to on-chain data storage. The contract cannot store usage data without an active subscription.

## Dispute Resolution

Usage disputes can be resolved by querying:
1. `get-usage-event` — exact usage at each block
2. `get-carrier-stats` — carrier reporting patterns
3. `get-payment-details` — payment confirmation

These records are independently verifiable by any third party.
