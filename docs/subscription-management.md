# Subscription Management

DataChain Africa provides on-chain subscription lifecycle management through the `billing.clar` and `data-tracking.clar` contracts.

## Subscribing

Call `subscribe-and-pay` in `billing.clar` to pay for a data plan:

```clarity
(subscribe-and-pay (plan-id uint) (tracking-contract <data-tracking-trait>) (promo-id uint))
```

- Validates the plan via the tracking contract
- Applies any valid promotional discount
- Transfers STX to the contract owner
- Records the subscription and payment
- Calls `subscribe-to-plan` on the tracking contract to update data balance

## Checking Subscription Status

```clarity
(get-subscription-status user) → {
  is-active: bool,        ;; true if payment-status and within grace period
  days-remaining: uint,   ;; blocks remaining / 144
  current-discount: uint  ;; applied discount rate
}
```

```clarity
(is-payment-due user) → bool
```

## Cancelling a Subscription

Users can self-cancel their active subscription:

```clarity
(cancel-subscription)
```

This:
- Requires an existing active subscription (`payment-status: true`)
- Sets `payment-status` to `false`
- Extends grace period from current block
- Prevents re-cancel via `err-already-cancelled (u209)`

After cancellation, the subscription remains accessible until the grace period ends.

## Renewing a Subscription

If a subscription's payment is due but within the grace period:

```clarity
(process-renewal-payment (tracking-contract <data-tracking-trait>))
```

Conditions:
- Subscription must exist
- `payment-status` must be `false` (payment due)
- Current block must be ≤ `grace-period-end`

## Grace Period

The grace period (in blocks) is configurable by the contract owner:

```clarity
(update-grace-period (blocks uint))
```

Default: 144 blocks (~1 day). Minimum: 1 block.

## Auto-Renew Toggle

Users can toggle auto-renewal for their data plan:

```clarity
(set-auto-renew (enabled bool))
```

When `true`, calling `process-plan-expiry` renews the plan and rolls over unused data.

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| u204 | err-no-subscription | No subscription found |
| u205 | err-grace-period-expired | Grace period has ended |
| u207 | err-contract-paused | Contract is paused |
| u208 | err-invalid-amount | Zero or invalid value |
| u209 | err-already-cancelled | Subscription already cancelled |
