# Marketplace Guide

The DataChain Africa marketplace allows users to trade unused data packages on-chain.

## Creating a Listing

```clarity
(contract-call? .marketplace create-listing
  u500       ;; data-amount (MB)
  u1000000   ;; price (microSTX)
  u100       ;; duration (blocks until expiry)
)
;; Returns: (ok listing-id)
```

## Purchasing a Listing

Buyers must have an active data plan before buying:

```clarity
(contract-call? .marketplace purchase-listing u1 .data-tracking)
```

On purchase:
1. STX is transferred from buyer to seller (minus platform fee)
2. Buyer's data balance increases by the listing's `data-amount`
3. Listing is marked inactive
4. Buyer and seller stats are updated

## Managing Your Listings

### Update price
```clarity
(contract-call? .marketplace update-listing-price u1 u750000)
```

### Extend duration
```clarity
(contract-call? .marketplace extend-listing-duration u1 u50)
```

### Cancel listing
```clarity
(contract-call? .marketplace cancel-listing u1)
```

## Listing Expiry

Listings expire after the duration (in blocks) set at creation time. Expired listings are no longer active:

```clarity
(contract-call? .marketplace is-listing-active u1)
;; Returns false if expired or cancelled
```

## Platform Fee

A platform fee (default 2%, max 10%) is deducted from each sale and kept in the contract. The seller receives `price - fee`:

```
Buyer pays: 1,000,000 microSTX
Fee (2%): 20,000 microSTX
Seller receives: 980,000 microSTX
```

## Self-Purchase Protection

Sellers cannot purchase their own listings — this would create circular value transfer.

## Analytics

After each trade, on-chain stats are updated:
- Total volume (microSTX)
- Total trades
- Seller's total revenue
- Buyer's total data purchased
