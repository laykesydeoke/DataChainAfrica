# Deployment Guide

## Prerequisites

- [Clarinet](https://github.com/hirosystems/clarinet) installed
- A Stacks wallet (Hiro Wallet recommended)
- STX tokens for deployment fees

## Testnet Deployment

### 1. Configure settings

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` with your deployer address and API URL.

### 2. Check contracts

```bash
clarinet check
```

All contracts should pass analysis without errors.

### 3. Deploy to testnet

Use the Clarinet console or deploy via the Hiro Platform:

```bash
clarinet console
```

Then deploy each contract in order (traits must be deployed first):

```
::set_tx_sender your-stx-address
(contract-call? 'your-address.data-traits ...)
```

Or use the Stacks CLI:
```bash
stacks-cli deploy contracts/data-traits.clar --network testnet
stacks-cli deploy contracts/data-tracking.clar --network testnet
stacks-cli deploy contracts/billing.clar --network testnet
stacks-cli deploy contracts/marketplace.clar --network testnet
```

### 4. Initialize contracts

After deployment, run admin setup:

1. Set up data plans in `data-tracking`:
   ```
   (contract-call? .data-tracking set-data-plan u1 u500 u144 u50000000)
   (contract-call? .data-tracking set-data-plan u2 u3072 u1008 u250000000)
   (contract-call? .data-tracking set-data-plan u3 u15360 u4320 u800000000)
   ```

2. Authorize carriers:
   ```
   (contract-call? .data-tracking authorize-carrier 'CARRIER_ADDRESS)
   ```

3. Set marketplace platform fee (optional, default 2%):
   ```
   (contract-call? .marketplace set-platform-fee u2)
   ```

### 5. Update frontend

Update `CONTRACT_ADDRESS` in `frontend/app.js` with your deployer address.

## Mainnet Deployment

Follow the same steps as testnet but use `--network mainnet`.

> **Warning**: Always thoroughly test on testnet before mainnet deployment.

## Carrier Management Post-Deploy

After deployment, manage carriers as follows:

### Add a new carrier
```
(contract-call? .data-tracking authorize-carrier 'NEW_CARRIER_ADDRESS)
```

### Monitor carrier stats
```
(contract-call? .data-tracking get-carrier-stats 'CARRIER_ADDRESS)
```

### Revoke a carrier
```
(contract-call? .data-tracking revoke-carrier 'CARRIER_ADDRESS)
```

## Contract Upgrade Path

Clarity contracts are immutable once deployed. To upgrade:

1. Deploy new contract version with a different name (e.g., `billing-v2`)
2. Migrate state data if required
3. Update frontend to call new contract

## Emergency Procedures

If you need to halt the platform urgently:

```
(contract-call? .billing set-paused true)
(contract-call? .data-tracking set-paused true)
(contract-call? .marketplace set-paused true)
```

To resume:
```
(contract-call? .billing set-paused false)
(contract-call? .data-tracking set-paused false)
(contract-call? .marketplace set-paused false)
```
