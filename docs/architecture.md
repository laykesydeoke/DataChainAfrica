# System Architecture

## Overview

DataChain Africa is a decentralized data tracking platform built on the Stacks blockchain. The system consists of four Clarity smart contracts that work together to provide transparent mobile data billing and trading.

## Contract Dependency Graph

```
                    data-traits.clar
                    (Trait definitions)
                         |
          ┌──────────────┼──────────────┐
          ↓              ↓              ↓
   billing.clar  data-tracking.clar  marketplace.clar
   (Payments)    (Usage tracking)    (P2P trading)
          ↓              ↑
          └──── calls ───┘
```

## Data Flow

### Subscription Flow

```
User → billing.subscribe-and-pay()
         → data-tracking.get-plan-details()    [verify plan]
         → stx-transfer? (user → contract)     [payment]
         → data-tracking.subscribe-to-plan()   [activate plan]
         → payment-history recorded            [audit trail]
```

### Usage Recording Flow

```
Carrier → data-tracking.record-usage()
            → check is-authorized (carrier map)
            → check data-balance (user map)
            → update user-data-usage
            → append usage-events (event log)
```

### Marketplace Flow

```
Seller → marketplace.create-listing()
           → data-tracking.get-usage()    [verify balance]
           → create data-listings entry
           → update user-sales

Buyer  → marketplace.purchase-listing()
           → check is-active + expiry
           → stx-transfer? (buyer → seller, minus fee)
           → stx-transfer? (buyer → owner, fee)
           → deactivate listing
           → update platform stats
```

## State Storage

| Map / Var | Contract | Description |
|---|---|---|
| `user-subscriptions` | billing | Per-user subscription state |
| `payment-history` | billing | All payment records |
| `promotional-rates` | billing | Active discount codes |
| `user-data-usage` | data-tracking | Per-user usage balances |
| `data-plans` | data-tracking | Available plans |
| `authorized-carriers` | data-tracking | Carrier whitelist |
| `usage-events` | data-tracking | Usage event log |
| `data-listings` | marketplace | Active and completed listings |
| `user-sales` | marketplace | Per-user seller stats |

## Security Model

- **Owner-only functions**: All admin functions require `tx-sender == contract-owner`
- **Carrier whitelist**: Usage can only be recorded by authorized carriers
- **Self-purchase protection**: Sellers cannot buy their own listings
- **Underflow protection**: All decrements are checked before execution
- **Pause mechanism**: All contracts can be independently paused by the owner
- **Fee cap**: Platform fee is capped at 10% to protect users

## Upgrade Strategy

Clarity contracts are immutable. The platform follows a versioned deployment strategy:
- v1 contracts are the current deployment
- Future versions will be deployed under new names (e.g., `billing-v2`)
- The frontend will be updated to point to new contract addresses
