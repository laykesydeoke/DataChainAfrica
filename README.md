# DataChain Africa

Blockchain-based mobile data tracking and billing for Nigeria. Built on the Stacks ecosystem to bring transparency to data consumption, enabling fair billing and peer-to-peer data trading.

## Features

- Real-time data usage tracking with blockchain verification
- Smart contract automated billing and renewals
- Transparent and immutable usage history
- Peer-to-peer data package trading marketplace
- Multiple plan types (daily, weekly, monthly)
- Emergency pause controls for contract admins
- Platform fee configuration for marketplace trades
- Self-purchase protection for marketplace listings
- On-chain platform analytics (revenue, subscribers, data recorded)
- Buyer history and per-user payment tracking
- Network usage summary across all carriers
- Subscription cancellation with grace period
- Seller listing price updates
- User-controlled auto-renew toggle
- Per-carrier usage statistics and event tracking
- Seller revenue and listing statistics
- Complete API reference documentation
- Grace period countdown display in dashboard
- Payment record queries and revenue in STX units
- On-chain data governance and compliance tools
- User rights and consent management
- Plan lifecycle governance (activate/deactivate)
- Carrier revocation and access control
- Data retention audit trail
- Operator governance dashboard
- Real-time network telemetry snapshot
- User-level telemetry reporting
- Billing telemetry with revenue in STX and µSTX
- Plan metrics and performance reporting
- Telemetry invariants enforcement
- Comprehensive metrics reference documentation

## Tech Stack

- **Blockchain**: Stacks
- **Smart Contracts**: Clarity 4
- **Frontend**: Static HTML/CSS/JS
- **Testing**: Clarinet SDK + Vitest

## Quick Start

```bash
git clone https://github.com/laykesydeoke/DataChainAfrica.git
cd DataChainAfrica
```

Install test dependencies:
```bash
npm install
```

Check contracts:
```bash
clarinet check
```

Run tests:
```bash
npm test
```

Run per-contract tests:
```bash
npm run test:billing
npm run test:tracking
npm run test:marketplace
```

Run analytics tests:
```bash
npm run test:analytics
npm run test:stats
npm run test:history
```

Run billing tests:
```bash
npm run test:billing-enhanced
npm run test:billing-flow
npm run test:billing-grace
```

Run marketplace analytics tests:
```bash
npm run test:marketplace-analytics
npm run test:buyer-stats
npm run test:seller-stats
```

## Smart Contract Features

### Marketplace

- Create, cancel, extend, and reprice listings
- Self-purchase protection
- Platform fee configuration (max 10%)
- On-chain volume and trade tracking
- Per-seller and per-buyer analytics
- Marketplace summary aggregate view

### Analytics Endpoints

See `docs/analytics-overview.md` for a complete reference of all analytics functions across all contracts.

Start frontend:
```bash
cd frontend && npx serve .
```

## Project Structure

```
DataChainAfrica/
├── contracts/
│   ├── data-tracking.clar    # Core data usage tracking
│   ├── billing.clar          # Billing and payments
│   ├── marketplace.clar      # P2P data trading
│   └── data-traits.clar      # Shared traits
├── frontend/
│   ├── index.html            # Landing page with dashboard
│   ├── styles.css            # Stylesheet
│   └── app.js                # Wallet and contract integration
├── tests/
│   ├── data-tracking_test.ts
│   ├── billing_test.ts
│   ├── marketplace_test.ts
│   └── data-traits_test.ts
├── .github/workflows/        # CI/CD
├── .env.example              # Environment variable template
├── Clarinet.toml
└── README.md
```

## Smart Contracts

### data-tracking.clar
Records and tracks data usage per user. Authorized carriers report usage events, which are stored immutably on-chain.

### billing.clar
Handles plan subscriptions, payments, and renewals. Supports promotional discount codes and configurable grace periods.

### marketplace.clar
Peer-to-peer data package trading. Includes platform fee, self-purchase protection, and on-chain volume tracking.

### data-traits.clar
Shared interface definitions used for cross-contract calls.

## Admin Controls

Contract owners have access to the following admin functions:

| Contract | Function | Description |
|---|---|---|
| billing | `set-paused` | Pause/unpause billing |
| billing | `update-grace-period` | Set grace period in blocks |
| data-tracking | `set-paused` | Pause/unpause usage recording |
| data-tracking | `deactivate-plan` | Retire a data plan |
| marketplace | `set-paused` | Pause/unpause marketplace |
| marketplace | `set-platform-fee` | Set fee % (max 10%) |

## Roadmap

- [x] Core smart contracts
- [x] Frontend landing page
- [x] Clarity 4 migration
- [x] Emergency pause mechanism
- [x] Platform fee for marketplace
- [x] CI/CD pipeline
- [x] On-chain analytics and buyer history tracking
- [x] Network usage summary
- [x] Subscription cancellation
- [x] Listing price updates
- [x] Auto-renew toggle
- [x] Listing duration extension
- [x] Subscription age tracking
- [x] Active subscription verification
- [ ] Mobile carrier integration
- [ ] Mobile app
- [ ] Beta launch

## Team

Lead Developer - Olalekan Akande

## Acknowledgments

- Stacks Foundation

## Data Staking

Stake data tokens to earn protocol rewards:

- **Stake Data**: Lock tokens for rewards
- **Reward Rate**: Configurable basis points

```bash
npm run test:staking
npm run test:staking-edge
```

## Node Registry

Operator node registration:
- Register nodes with type
- Track active operators

```bash
npm run test:nodes
```
