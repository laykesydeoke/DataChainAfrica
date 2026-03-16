# Frontend Integration Guide

The DataChain Africa frontend (`frontend/`) is a static HTML/CSS/JS application that integrates with the Stacks blockchain.

## Architecture

```
frontend/
├── index.html   # Main page
├── styles.css   # Stylesheet
└── app.js       # Wallet + contract integration
```

## Key Functions in app.js

### Wallet Connection

```javascript
connectWallet()         // Triggers Hiro Wallet connect
handleWalletClick()     // Toggle connect/disconnect
onConnected(address)    // Called after successful auth
```

### Data Loading

```javascript
loadDashboard(address)          // Load user data usage stats
loadPlatformStats()             // Load marketplace volume stats
loadAnalyticsDashboard()        // Load billing + network analytics
loadUserAnalytics(address)      // Load per-user payment + purchase history
loadCarrierStats(carrierAddr)   // Load per-carrier usage stats
loadBillingStats(address)       // Load grace period + subscription plan
loadMarketplace()               // Load active listings
```

### Transactions

```javascript
subscribeToPlan(planId)                    // Subscribe to a data plan
cancelSubscription()                        // Cancel active subscription
purchaseListing(listingId)                 // Buy data from marketplace
extendListing(listingId, extraBlocks)      // Extend a listing's duration
```

## Calling Read-Only Functions

All read-only calls use the `callReadOnly` helper:

```javascript
callReadOnly('data-tracking', 'get-user-data', ['0x...'])
  .then(function(data) {
    var parsed = parseClarityValue(data.result);
    // use parsed
  });
```

## Parsing Clarity Values

```javascript
parseClarityUint(hex)    // Parses 0x01... → number
parseClarityBool(hex)    // Parses 0x03/0x04 → bool
parseClarityValue(val)   // Parses tuple/struct → object
```

## Environment

Update `CONTRACT_ADDRESS` and `API_URL` in `app.js`:

```javascript
var API_URL = 'https://api.testnet.hiro.so';
var CONTRACT_ADDRESS = 'ST1PQ...YOUR_DEPLOYER_ADDRESS';
```

## Local Development

Start a local server:

```bash
cd frontend && npx serve .
```

Then open `http://localhost:3000`.

## Adding New Features

1. Add a new function in `app.js`
2. Call it from `onConnected()` if it needs user context
3. Add corresponding HTML elements in `index.html`
4. Style in `styles.css`
