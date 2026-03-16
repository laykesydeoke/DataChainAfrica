# Carrier Integration Guide

Mobile network carriers can integrate with DataChain Africa to record on-chain data usage events.

## Authorization

Before recording usage, a carrier must be authorized by the contract owner:

```clarity
;; Owner authorizes carrier
(authorize-carrier 'SP1CARRIER_ADDRESS)
```

To revoke:
```clarity
(revoke-carrier 'SP1CARRIER_ADDRESS)
```

Carriers can check their own status:
```clarity
(is-carrier-authorized 'SP1CARRIER_ADDRESS) → bool
```

## Recording Usage

Authorized carriers call `record-usage` to log data consumption:

```clarity
(record-usage (user principal) (usage uint))
```

Parameters:
- `user`: The STX address of the subscriber
- `usage`: Data consumed in MB (must be ≤ current balance)

### Validation
The contract checks:
1. Caller is an authorized carrier
2. Usage does not exceed user's `data-balance`
3. User's plan has not expired (`plan-expiry > current-block`)

### Event Storage
Each `record-usage` call creates a `usage-events` entry:
```
{
  user: principal,
  usage-amount: uint,
  timestamp: uint,           ;; stacks-block-height
  carrier: principal,
  remaining-balance: uint
}
```

Events are queryable via `get-usage-event` (by ID) or `get-usage-history` (by user + event ID).

## Integration Architecture

```
Mobile Network (Carrier Backend)
        ↓
  Hiro API Endpoint
  POST /v2/transactions
        ↓
  data-tracking.clar
  record-usage(user, usage)
        ↓
  On-chain storage +
  total-data-recorded counter
```

## Sample Integration Flow

1. Carrier detects data consumption for user `ST1USER...`
2. Backend submits STX transaction calling `record-usage`
3. Contract validates and stores event
4. User can verify usage on-chain via `get-usage-event`
5. Billing system reads usage history for billing reconciliation

## Error Handling

| Error | Code | Meaning |
|-------|------|---------|
| `err-invalid-caller` | u101 | Carrier not authorized |
| `err-invalid-data` | u102 | Usage exceeds balance or user not found |
| `err-expired-plan` | u103 | User's plan has expired |
| `err-contract-paused` | u106 | Contract paused by admin |

## Batch Reporting

The Clarity contract processes one `record-usage` call per Stacks block transaction. For high-volume carriers, consider aggregating usage per block interval before submitting.

## Testnet Integration

Use the Stacks testnet to simulate carrier integration before mainnet deployment:

```bash
# Check if a carrier is authorized
curl https://api.testnet.hiro.so/v2/contracts/call-read/CONTRACT/data-tracking/is-carrier-authorized \
  -d '{"sender":"CONTRACT","arguments":["0xCAR_ADDR_HEX"]}'
```
