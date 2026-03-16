# Data Indexing Guide

Since Clarity contracts store data in maps without native querying, indexing strategies are needed for efficient frontend and analytics use.

## On-Chain Counters

DataChain Africa uses counters to enable pagination-style queries:

| Counter | Contract | Function |
|---------|----------|----------|
| `listing-counter` | marketplace | `(get-listing-count)` |
| `event-counter` | data-tracking | `(get-latest-event-id)` |
| `payment-counter` | billing | `(get-total-payments)` |
| `plan-counter` | data-tracking | `(get-total-plans)` |

## Querying Listings

Since there's no native list iteration, iterate over listing IDs:

```javascript
const count = await callReadOnly('marketplace', 'get-listing-count');
for (let i = 1; i <= count; i++) {
  const listing = await callReadOnly('marketplace', 'get-listing', [uint(i)]);
  if (listing && listing['is-active']) {
    // process active listing
  }
}
```

## Querying Events

Iterate usage events:
```javascript
const lastId = await callReadOnly('data-tracking', 'get-latest-event-id');
for (let i = 1; i <= lastId; i++) {
  const event = await callReadOnly('data-tracking', 'get-usage-event', [uint(i)]);
  // filter by user
}
```

## Hiro Chainhook for Real-Time Indexing

For production use, subscribe to on-chain events with [Chainhooks](https://docs.hiro.so/chainhook):

```json
{
  "name": "marketplace-purchase",
  "version": 1,
  "chain": "stacks",
  "networks": {
    "testnet": {
      "start-block": 1,
      "if-this": {
        "scope": "contract-call",
        "method": "purchase-listing"
      },
      "then-that": {
        "http-post": {
          "url": "https://your-indexer/marketplace/purchase",
          "authorization-header": "Bearer YOUR_TOKEN"
        }
      }
    }
  }
}
```

## Suggested Indexer Architecture

```
Stacks Chain
    ↓ (Chainhook)
Indexer Service (Node.js / Python)
    ↓
PostgreSQL / SQLite
    ↓
REST API
    ↓
Frontend
```

## Key Events to Index

| Contract | Function | Data to store |
|----------|----------|--------------|
| marketplace | `purchase-listing` | listing-id, buyer, price, timestamp |
| marketplace | `create-listing` | listing-id, seller, data-amount, price |
| billing | `subscribe-and-pay` | user, plan-id, amount, payment-id |
| data-tracking | `record-usage` | user, carrier, usage, event-id |

## Rate Limits

Hiro's API allows:
- Free tier: 50 requests/minute
- Paid tier: unlimited

For high-traffic dashboards, implement caching with a 10-30 second TTL.
