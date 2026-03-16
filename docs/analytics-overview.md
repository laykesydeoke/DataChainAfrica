# Analytics Overview

DataChain Africa provides comprehensive on-chain analytics across all three contracts.

## Analytics Hierarchy

```
Platform Level
  ├── Marketplace
  │     ├── Total Volume (microSTX)
  │     ├── Total Trades
  │     ├── Total Listings
  │     └── Active Listings
  ├── Billing
  │     ├── Total Revenue (microSTX)
  │     ├── Total Subscribers
  │     └── Total Payments
  └── Data Tracking (Network)
        ├── Total Data Recorded (MB)
        ├── Total Unique Users
        ├── Total Events
        └── Total Plans

User Level
  ├── Subscription
  │     ├── Plan ID and Type
  │     ├── Subscription Age
  │     ├── Grace Period Remaining
  │     └── Payment Count
  ├── Data Usage
  │     ├── Total Data Used
  │     ├── Data Balance
  │     └── Plan Expiry
  ├── Marketplace (Buyer)
  │     ├── Total Purchases
  │     ├── Total Data Bought
  │     └── Total Spent
  └── Marketplace (Seller)
        ├── Total Sales Revenue
        ├── Total Data Sold
        └── Active Listings

Carrier Level
  ├── Total Usage Reported
  ├── Total Events Submitted
  └── Last Report Block
```

## Frontend Integration

All analytics are loaded after wallet connection:

```javascript
onConnected(address) {
  loadDashboard(address);          // data usage
  loadPlatformStats();             // marketplace stats
  loadAnalyticsDashboard();        // billing + network
  loadUserAnalytics(address);      // user-specific
  loadCarrierStats(address);       // carrier stats
  loadBillingStats(address);       // grace period + plan
  loadMarketplaceAnalytics();      // marketplace overview
}
```

## Real-Time Updates

For real-time dashboards, subscribe to events via Chainhook:
- `record-usage` → update network stats
- `subscribe-and-pay` → update billing stats
- `purchase-listing` → update marketplace stats

See `docs/indexing.md` for Chainhook configuration.
