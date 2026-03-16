# Buyer Guide: Purchasing Data on the Marketplace

This guide covers how to buy data from other users on the DataChain Africa marketplace.

## Prerequisites

1. A Hiro Wallet installed in your browser
2. STX tokens to cover the listing price and gas fees
3. An active network connection to Stacks testnet (or mainnet)

## Finding Listings

The marketplace page shows all active listings. Each card displays:
- **Data amount** (MB available for purchase)
- **Price** (in STX)
- **Expiry** (how long the listing is open)

You can also query listings directly:
```bash
# Get all listing metadata
curl https://api.testnet.hiro.so/v2/contracts/call-read/CONTRACT/marketplace/get-listing \
  -d '{"sender":"YOUR_ADDRESS","arguments":["0x0100000000000000000000000000000001"]}'
```

## Making a Purchase

1. Click **Buy** on a listing card
2. Your Hiro Wallet will open to confirm the transaction
3. Review the STX amount (price minus platform fee goes to seller; 2% platform fee)
4. Confirm and submit

The transaction calls:
```clarity
(purchase-listing (listing-id uint) (tracking-contract <data-tracking-trait>))
```

### Self-Purchase Protection
You cannot purchase your own listing. The contract returns `err-self-purchase (u308)` if attempted.

### Listing Expiry
Listings expire after the block height specified by the seller. Attempting to purchase an expired listing returns `err-listing-expired (u303)`.

## After Purchase

Once confirmed, your buyer stats update:
- `total-purchases` increments by 1
- `total-data-bought` adds the MB from the listing
- `total-spent` adds the full listing price

Check your stats via:
```clarity
(get-buyer-stats 'YOUR_ADDRESS)
```

Or from the frontend, connect your wallet and view the **Your Stats** section under Platform Analytics.

## Platform Fee

The marketplace charges a 2% platform fee on each trade (configurable up to 10% by the contract owner). The fee is deducted from the listing price:
- **Seller receives**: price × 0.98
- **Platform receives**: price × 0.02

## Cancellations

Only sellers can cancel listings. Buyers cannot cancel a completed transaction once submitted to the blockchain.

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `err-insufficient-funds (u305)` | Not enough STX | Add more STX to wallet |
| `err-listing-expired (u303)` | Listing timed out | Find another active listing |
| `err-self-purchase (u308)` | Buying your own listing | Use a different address |
| `err-contract-paused (u306)` | Marketplace under maintenance | Wait and retry |
