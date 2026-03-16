# Multi-Carrier Architecture

DataChain Africa is designed to support multiple carriers reporting usage independently.

## How Multi-Carrier Works

Each carrier is a separate principal. The `record-usage` function tracks the calling principal as the `carrier` field in usage events and aggregates per-carrier stats.

```
Carrier A (MTN) ──────┐
Carrier B (Glo)  ──────┤──► data-tracking.record-usage
Carrier C (Airtel) ────┘
```

All three carriers report for the same users. Stats are partitioned per carrier.

## Querying Per-Carrier Data

```clarity
;; All stats for Carrier A
(contract-call? .data-tracking get-carrier-stats 'CARRIER_A_ADDRESS)
;; { total-usage-reported: u50000, total-events: u200, last-report-block: u12345 }

;; Just the total usage volume
(contract-call? .data-tracking get-carrier-total-usage 'CARRIER_A_ADDRESS)
;; u50000
```

## Authorization Model

- Only the contract owner can authorize or revoke carriers
- There is no limit on the number of carriers that can be authorized
- Revoking a carrier immediately prevents future usage reports
- Historical events remain on-chain even after revocation

## Event Attribution

Each usage event stores the carrier that reported it:

```clarity
{ event-id: uint } →
{
  user: principal,
  usage-amount: uint,
  timestamp: uint,
  carrier: principal,   ;; ← carrier attribution
  remaining-balance: uint
}
```

Frontend and indexer applications can filter events by carrier.

## Carrier Rotation

When a carrier key is compromised:

1. Revoke the old carrier: `(contract-call? .data-tracking revoke-carrier 'OLD_CARRIER)`
2. Authorize a new carrier: `(contract-call? .data-tracking authorize-carrier 'NEW_CARRIER)`
3. Historical events attributed to old carrier remain in history

## Metrics to Monitor

| Metric | How to Query |
|--------|-------------|
| Carrier active? | `is-carrier-authorized` |
| Carrier total MB | `get-carrier-total-usage` |
| Carrier event count | `get-carrier-stats` → `total-events` |
| Last report block | `get-carrier-stats` → `last-report-block` |
| Network total MB | `get-total-data-recorded` |

## Production Recommendations

- Use separate wallets for each carrier
- Monitor `last-report-block` to detect stalled carriers
- Set up alerts if a carrier hasn't reported in >144 blocks
- Store carrier addresses in a centralized registry
