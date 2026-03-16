# Marketplace Analytics

DataChain Africa provides on-chain analytics for the data marketplace.

## Available Metrics

### Platform-Level Stats

```clarity
(contract-call? .marketplace get-platform-stats)
;; Returns:
;; {
;;   total-volume: uint,    ;; cumulative microSTX traded
;;   total-trades: uint,    ;; total successful purchases
;;   total-listings: uint   ;; total listings ever created
;; }
```

### Marketplace Summary (with active listings count)

```clarity
(contract-call? .marketplace get-marketplace-summary)
;; Returns:
;; {
;;   total-volume: uint,
;;   total-trades: uint,
;;   total-listings: uint,
;;   active-listings: uint  ;; current listing counter
;; }
```

### Seller Stats

```clarity
(contract-call? .marketplace get-seller-stats 'SELLER_ADDRESS)
;; Returns:
;; {
;;   total-sales: uint,       ;; cumulative microSTX received
;;   total-data-sold: uint,   ;; total MB sold
;;   active-listings: uint    ;; current active listings
;; }
```

### Seller Revenue

```clarity
(contract-call? .marketplace get-seller-revenue 'SELLER_ADDRESS)
;; Returns: uint (microSTX earned)
```

### Total Data Sold (per seller)

```clarity
(contract-call? .marketplace get-total-data-sold 'SELLER_ADDRESS)
;; Returns: uint (MB sold)
```

### Buyer Stats

```clarity
(contract-call? .marketplace get-buyer-stats 'BUYER_ADDRESS)
;; Returns:
;; {
;;   total-purchases: uint,   ;; number of purchases
;;   total-data-bought: uint, ;; total MB purchased
;;   total-spent: uint        ;; microSTX spent
;; }
```

## Leaderboard Strategy

Since Clarity lacks native sorting, build leaderboards off-chain:

```javascript
// Iterate sellers by known address list or via Chainhook events
const sellers = ['addr1', 'addr2', 'addr3'];
const stats = await Promise.all(
  sellers.map(addr => callReadOnly('marketplace', 'get-seller-stats', [principalCV(addr)]))
);
stats.sort((a, b) => b['total-sales'] - a['total-sales']);
```

## Indexing Recommendations

Track these events via Chainhook:
- `create-listing` → record seller, data amount, price
- `purchase-listing` → record buyer, seller, amount, data
- `cancel-listing` → record seller, listing id

Store in a database for fast analytics queries.

## Platform Fee Impact

Platform fee is deducted from the seller's proceeds:

```
Buyer pays: 1,000,000 microSTX
Platform fee (2%): 20,000 microSTX
Seller receives: 980,000 microSTX
Volume tracked: 1,000,000 microSTX (gross)
```
