# Data Economics

DataChain Africa creates a token-gated data economy where STX represents the medium of exchange for mobile data access.

## Value Flows

### Subscription Flow
```
Subscriber → STX → Contract Owner (Carrier)
```
Users pay for data plans in STX. The billing contract deducts promotional discounts before transferring.

### Marketplace Flow
```
Buyer → STX (98%) → Seller
Buyer → STX (2%)  → Contract Owner (Platform)
```
The platform fee (default 2%, max 10%) compensates the infrastructure provider.

## Pricing Model

### Plan Pricing
Data plan prices are set by the contract owner (carrier) and stored in the `data-plans` map. Plans are quoted in microSTX:

```
1 STX = 1,000,000 microSTX
```

Example plans:
- 500 MB / 144 blocks: 50 STX = 50,000,000 μSTX
- 3 GB / 1008 blocks: 250 STX = 250,000,000 μSTX
- 15 GB / 4320 blocks: 800 STX = 800,000,000 μSTX

### Marketplace Pricing
Sellers set their own price. Market forces determine fair value. Prices may be:
- **Below plan price**: Seller discounts unused data (quick sale)
- **At plan price**: Standard pricing
- **Above plan price**: Premium for convenience (no subscription required)

## Promotional Discounts

Promotional codes reduce the effective price of a subscription:

```
discounted-price = price × (100 - discount%) / 100
```

Example: 10% discount on a 100 STX plan = 90 STX paid.

Promos expire at a configurable block height. The billing contract applies the discount at subscription time if the promo is still valid.

## Revenue Distribution

| Recipient | Source | Amount |
|-----------|--------|--------|
| Contract Owner | Subscriptions | Full plan price (minus discount) |
| Seller | Marketplace sale | price × (100 - fee%) / 100 |
| Contract Owner | Marketplace fee | price × fee% / 100 |

## Supply Constraints

Data on the marketplace comes from users who have active subscriptions with remaining balance. This creates a natural supply ceiling tied to active network subscribers.

## Demand Drivers

- Users who need data without a full subscription
- Users who want to buy data at below-plan prices
- Users who missed the subscription window and need immediate access

## On-Chain Accounting

All revenue metrics are tracked on-chain:
- `total-revenue` (billing): cumulative STX from subscriptions
- `total-volume-stx` (marketplace): cumulative STX from trades
- `total-data-recorded` (data-tracking): total MB consumed on-chain
