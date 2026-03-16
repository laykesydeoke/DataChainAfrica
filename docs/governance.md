# Data Governance

DataChain Africa follows a transparent governance model for contract administration and data access.

## Admin Roles

### Contract Owner

The deployer address is the contract owner for all three contracts. Owner responsibilities:

| Contract | Admin Actions |
|----------|--------------|
| data-tracking | Set plans, authorize/revoke carriers, pause |
| billing | Set promos, update grace period, pause |
| marketplace | Set platform fee, pause |

### Carrier Role

Carriers are specifically authorized principals that can call `record-usage`. This role should be assigned to mobile network operator wallets or authorized backend systems.

## Access Control

All sensitive functions use the pattern:

```clarity
(asserts! (is-eq tx-sender contract-owner) (err err-owner-only))
```

## Pause Mechanism

Contracts can be paused by the owner in emergencies. Pausing blocks:
- data-tracking: `subscribe-to-plan`, `record-usage`, `set-data-plan`
- billing: `subscribe-and-pay`, `process-renewal-payment`
- marketplace: `create-listing`, `purchase-listing`

Read-only functions always remain accessible.

## Immutability

Once deployed on Stacks mainnet, contracts cannot be changed. Upgrades require deploying a new contract.

## Data Retention

All data written to on-chain maps persists indefinitely. There is no expiry of:
- User subscription records
- Usage events
- Payment history
- Listing history

## Privacy Considerations

All on-chain data is publicly readable. Users' subscription status, data usage, and marketplace history are visible to anyone. This is by design for transparency and auditability.

## Dispute Resolution

Since all state is on-chain, disputes can be verified by:
1. Looking up the relevant event ID or payment ID
2. Querying the contract state at a specific block
3. Examining the transaction history on a Stacks explorer

## Emergency Procedures

See `docs/deployment.md` for emergency pause and carrier management procedures.
