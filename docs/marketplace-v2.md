# Marketplace V2 Features

DataChain Africa's marketplace has been upgraded with additional seller controls for managing active listings.

## New Functions

### extend-listing-duration

Sellers can extend how long their listing stays active on the marketplace:

```clarity
(extend-listing-duration (listing-id uint) (extra-blocks uint))
```

**Parameters:**
- `listing-id`: The ID of the listing to extend
- `extra-blocks`: Additional blocks to add to the current expiry

**Conditions:**
- Caller must be the original seller
- Listing must be currently active
- `extra-blocks` must be greater than 0

**Use case:** When a listing is about to expire but hasn't been purchased yet, the seller can extend it instead of cancelling and re-creating.

### update-listing-price

Sellers can reprice their active listings:

```clarity
(update-listing-price (listing-id uint) (new-price uint))
```

**Parameters:**
- `listing-id`: The ID of the listing to update
- `new-price`: New price in microSTX

**Conditions:**
- Caller must be the original seller
- Listing must be currently active
- `new-price` must be greater than 0

**Use case:** React to market conditions or run promotional pricing without cancelling and re-listing.

## How Fees Apply to Updates

Updating price or duration does **not** retroactively change pending buyer interactions. The platform fee percentage is applied at purchase time based on the current price when the buyer submits the transaction.

## Listing State Machine

```
created (active)
    ↓
[seller extends / updates price]
    ↓
still active
    ↓
[buyer purchases OR seller cancels OR block height > expiry]
    ↓
inactive (no further updates possible)
```

## Querying Updated Listings

After updating a listing, the new data is immediately readable:

```clarity
(get-listing listing-id) → (optional { seller, data-amount, price, expiry, is-active })
(is-listing-active listing-id) → bool
```

## Error Codes for V2 Functions

| Error | Code | Description |
|-------|------|-------------|
| `err-invalid-listing` | u301 | Listing ID does not exist |
| `err-listing-expired` | u303 | Listing is inactive or past expiry |
| `err-not-seller` | u304 | Caller is not the listing's creator |
| `err-insufficient-funds` | u305 | Zero price or zero extra blocks |
