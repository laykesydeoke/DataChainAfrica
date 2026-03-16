# Carrier Management

DataChain Africa supports multiple authorized carriers that can report data usage events on behalf of users.

## What is a Carrier?

A carrier is any authorized principal (wallet or contract) that has permission to call `record-usage` in the `data-tracking` contract. In production, this would be a mobile network operator's backend system.

## Authorizing a Carrier

Only the contract owner can authorize carriers:

```clarity
(contract-call? .data-tracking authorize-carrier 'CARRIER_ADDRESS)
```

Or from a frontend/backend:
```javascript
await openContractCall({
  contractName: 'data-tracking',
  functionName: 'authorize-carrier',
  functionArgs: [principalCV('CARRIER_ADDRESS')],
});
```

## Revoking a Carrier

```clarity
(contract-call? .data-tracking revoke-carrier 'CARRIER_ADDRESS)
```

Revoked carriers immediately lose the ability to record usage events.

## Per-Carrier Statistics

Each carrier's contribution is tracked independently:

```clarity
(contract-call? .data-tracking get-carrier-stats 'CARRIER_ADDRESS)
;; Returns: { total-usage-reported: uint, total-events: uint, last-report-block: uint }
```

Query total usage for a carrier:
```clarity
(contract-call? .data-tracking get-carrier-total-usage 'CARRIER_ADDRESS)
```

## Checking Authorization Status

```clarity
(contract-call? .data-tracking is-carrier-authorized 'CARRIER_ADDRESS)
;; Returns: bool
```

## Multi-Carrier Architecture

Multiple carriers can coexist. Usage events from different carriers are independently attributed:

```
Carrier A → record-usage (user1, 100MB) → carrier-stats[A].total += 100
Carrier B → record-usage (user1, 200MB) → carrier-stats[B].total += 200
Network total = 300MB
```

## Reporting Flow

1. Carrier calls `record-usage` with user principal and bytes used
2. Contract validates:
   - Carrier is authorized
   - User has an active plan
   - Usage does not exceed remaining balance
3. On success:
   - User balance decreases
   - Event is logged with `event-id`
   - Carrier stats are updated
   - Network totals are updated

## Rate Limiting (Recommended)

Carriers should self-limit reporting frequency to avoid excessive on-chain writes. A reasonable interval is every 12 blocks (~2 hours on Stacks).

## Security Considerations

- Never share carrier keys across different networks
- Rotate carrier keys if compromise is suspected (revoke + re-authorize)
- Use hardware wallets or HSMs for carrier key management in production
