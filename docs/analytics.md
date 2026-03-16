# Analytics & Platform Statistics

DataChain Africa exposes on-chain analytics through read-only contract functions accessible to any client or aggregator.

## Billing Analytics

### Platform Summary
```clarity
(get-platform-summary)
```
Returns a tuple with aggregate billing data:
```
{
  total-revenue: uint,       ;; cumulative STX collected
  total-subscribers: uint,   ;; number of subscribe-and-pay calls
  total-payments: uint       ;; payment counter (unique payment IDs)
}
```

### Revenue
```clarity
(get-total-revenue) → uint
```
Total STX revenue received by the billing contract (before discount adjustments are deducted off-chain).

### Subscriber Count
```clarity
(get-total-subscribers) → uint
```
Count of all `subscribe-and-pay` calls. Note: one user subscribing multiple times increments this counter each time.

### Per-User Payment Count
```clarity
(get-user-payment-count (user principal)) → uint
```
How many times a given user has successfully subscribed or renewed.

## Data-Tracking Network Stats

### Network Summary
```clarity
(get-network-summary)
```
Returns:
```
{
  total-data-recorded: uint,    ;; MB recorded across all users
  total-unique-users: uint,     ;; users who subscribed at least once
  total-events: uint,           ;; number of usage-event records
  total-plans: uint             ;; number of plan-creation calls
}
```

### Total Data Recorded
```clarity
(get-total-data-recorded) → uint
```
Sum of all data (MB) recorded via `record-usage` across all carriers and users.

### Total Unique Users
```clarity
(get-total-unique-users) → uint
```
Number of unique principals who have subscribed to a plan at least once.

## Marketplace Analytics

### Platform Stats
```clarity
(get-platform-stats)
```
Returns:
```
{
  total-volume: uint,      ;; cumulative STX traded
  total-trades: uint,      ;; completed purchases
  total-listings: uint     ;; total listing IDs created
}
```

### Buyer Stats
```clarity
(get-buyer-stats (user principal))
```
Returns per-user purchase history:
```
{
  total-purchases: uint,      ;; number of buys
  total-data-bought: uint,    ;; MB acquired
  total-spent: uint           ;; STX spent (gross, before fee deduction)
}
```

### Seller Stats
```clarity
(get-user-sales (user principal))
```
Returns:
```
{
  total-sales: uint,        ;; completed sales
  total-data-sold: uint,    ;; MB sold
  active-listings: uint     ;; open listings
}
```

## Querying via Hiro API

All analytics functions are read-only and can be queried without a wallet:

```bash
curl -X POST \
  https://api.testnet.hiro.so/v2/contracts/call-read/CONTRACT_ADDRESS/billing/get-platform-summary \
  -H "Content-Type: application/json" \
  -d '{"sender":"CONTRACT_ADDRESS","arguments":[]}'
```

## Frontend Integration

The frontend calls `loadAnalyticsDashboard()` on page load to populate:
- `#analyticRevenue` — total billing revenue
- `#analyticSubscribers` — total subscriber count
- `#analyticDataRecorded` — total MB tracked on-chain
- `#analyticUsers` — unique users

Per-user analytics are loaded via `loadUserAnalytics(address)` after wallet connection.
