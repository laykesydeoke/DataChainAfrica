# Seller Guide: Listing Data on the Marketplace

This guide explains how to list your unused data balance for sale on DataChain Africa.

## Prerequisites

1. A Hiro Wallet connected to the dApp
2. An active data subscription with available balance
3. STX for gas fees

## How Listings Work

When you create a listing, the marketplace contract verifies your current data balance by calling `get-usage` on the data-tracking contract. You must have at least as much data as you're listing.

> **Note:** Listing does not lock or deduct your data immediately. The data is transferred when someone purchases the listing. Ensure you don't consume the listed data before a buyer purchases.

## Creating a Listing

1. Navigate to the **Marketplace** section
2. Enter the amount of data to list (MB) and your asking price (STX)
3. Set how many blocks the listing should stay active
4. Submit via your Hiro Wallet

This calls:
```clarity
(create-listing
  (data-amount uint)    ;; MB to sell
  (price uint)          ;; asking price in STX
  (blocks-active uint)  ;; listing duration
  (tracking-contract <data-tracking-trait>))
```

The function returns the new `listing-id`.

## Managing Your Listings

Your active listing count is tracked in `user-sales`:
```clarity
(get-user-sales 'YOUR_ADDRESS)
;; { total-sales: u5, total-data-sold: u2500, active-listings: u2 }
```

You can also check:
```clarity
(get-user-active-listings 'YOUR_ADDRESS) → uint
```

## Cancelling a Listing

If you change your mind before a buyer purchases, you can cancel:
```clarity
(cancel-listing (listing-id uint))
```

Only the original seller can cancel. Cancellation sets the listing `is-active` to `false` and decrements your `active-listings` count.

## When Your Data Sells

After a successful purchase:
- Your `total-sales` increments
- Your `total-data-sold` increases by the listing's `data-amount`
- Your `active-listings` decrements
- You receive: `price × (100 - platform-fee-pct) / 100` STX

## Pricing Strategy

Consider:
- **Market rate**: Check existing listings to understand demand
- **Platform fee**: Currently 2%, max 10%
- **Listing duration**: Shorter durations create urgency; longer durations increase visibility
- **Data amount**: Larger bundles can command a premium

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `err-insufficient-data (u302)` | Balance lower than listing amount | Reduce listing size |
| `err-not-seller (u304)` | Cancelling someone else's listing | Use the creator address |
| `err-listing-expired (u303)` | Listing already expired | Create a new listing |
| `err-contract-paused (u306)` | Marketplace under maintenance | Wait and retry |
