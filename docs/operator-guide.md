# Operator Guide

This guide is for mobile network operators deploying and managing DataChain Africa contracts.

## Initial Deployment

1. Deploy `data-tracking` contract
2. Deploy `billing` contract with `data-tracking` principal
3. Deploy `marketplace` contract

```bash
clarinet deployments apply --devnet
```

## Creating Data Plans

Plans are identified by a uint ID. Set price in microSTX (1 STX = 1,000,000 µSTX).

```clarity
(contract-call? .data-tracking set-data-plan
  u1          ;; plan-id
  u5000       ;; data-allowance (MB)
  u144        ;; duration-blocks (~24 hrs)
  u5000000)   ;; price-in-ustx (5 STX)
```

## Authorizing Carriers

Only authorized principals can report data usage:

```clarity
(contract-call? .data-tracking authorize-carrier 'SP_CARRIER_ADDRESS)
```

To revoke:

```clarity
(contract-call? .data-tracking revoke-carrier 'SP_CARRIER_ADDRESS)
```

## Emergency Pause

If fraudulent usage is detected, pause the contracts:

```clarity
(contract-call? .data-tracking set-paused true)
(contract-call? .billing set-paused true)
(contract-call? .marketplace set-paused true)
```

Resume after investigation:

```clarity
(contract-call? .data-tracking set-paused false)
```

## Monitoring

### Key Metrics

```clarity
;; Total data consumed network-wide
(contract-call? .data-tracking get-network-stats)

;; Total revenue collected
(contract-call? .billing get-total-payments)

;; Marketplace activity
(contract-call? .marketplace get-platform-stats)
```

### Carrier Performance

```clarity
(contract-call? .data-tracking get-carrier-stats 'SP_CARRIER_ADDRESS)
```

## Plan Lifecycle

1. Create plan with `set-data-plan`
2. Users subscribe via `subscribe-to-plan` or `billing.subscribe-and-pay`
3. Carriers report usage via `record-usage`
4. Plans expire at `plan-expiry` block
5. Operator triggers `process-plan-expiry` for auto-renew users
6. Deactivate obsolete plans with `deactivate-plan`

## Billing Configuration

```clarity
;; Set grace period (default: 144 blocks = ~24 hrs)
(contract-call? .billing set-grace-period u288)
```

Grace period allows users to renew without service interruption.
