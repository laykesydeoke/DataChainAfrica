# DataChain Africa

Blockchain-based mobile data tracking and billing for Nigeria. Built on the Stacks ecosystem to bring transparency to data consumption, enabling fair billing and peer-to-peer data trading.

## Features

- Real-time data usage tracking with blockchain verification
- Smart contract automated billing and renewals
- Transparent and immutable usage history
- Peer-to-peer data package trading marketplace
- Multiple plan types (daily, weekly, monthly)

## Tech Stack

- **Blockchain**: Stacks
- **Smart Contracts**: Clarity
- **Frontend**: Static HTML/CSS/JS
- **Testing**: Clarinet SDK

## Quick Start

```bash
git clone https://github.com/laykesydeoke/DataChainAfrica.git
cd DataChainAfrica
```

Check contracts:
```bash
clarinet check
```

Run tests:
```bash
clarinet test
```

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
├── Clarinet.toml
└── README.md
```

## Smart Contracts

- **data-tracking.clar** - Records and tracks data usage per user
- **billing.clar** - Handles plan subscriptions, payments, renewals
- **marketplace.clar** - Peer-to-peer data package trading
- **data-traits.clar** - Shared interface traits

## Roadmap

- [x] Core smart contracts
- [x] Frontend landing page
- [ ] Mobile carrier integration
- [ ] Mobile app
- [ ] Beta launch

## Team

Lead Developer - Olalekan Akande

## Acknowledgments

- Stacks Foundation
