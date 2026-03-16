# Billing Guide

DataChain Africa uses transparent on-chain billing. Every payment is recorded immutably on the Stacks blockchain.

## How Billing Works

1. User selects a data plan
2. User calls `subscribe-and-pay` with their plan ID
3. STX is transferred from user wallet to contract
4. A subscription record and payment record are created on-chain
5. User's data allocation is set in `data-tracking`

## Subscription Lifecycle

```
subscribe-and-pay
     ↓
[active subscription]
     ↓
plan-expiry (automatic)
     ↓
is-payment-due = true
     ↓
process-renewal-payment (manual or auto)
     ↓
[renewed subscription]
```

## Cancellation

Users can cancel at any time:

```clarity
(contract-call? .billing cancel-subscription)
```

After cancellation, a grace period begins. During the grace period:
- The subscription is still technically active
- The user can renew with `process-renewal-payment`
- After grace period expires, the subscription lapses

## Grace Period

Default grace period is 144 blocks (~24 hours). Admin can update:

```clarity
(contract-call? .billing update-grace-period u288) ;; 2 days
```

## Promotional Discounts

Admin can set promotional rates:

```clarity
(contract-call? .billing set-promotional-rate
  u1          ;; promo-id
  u10         ;; 10% discount
  u10000      ;; valid until block 10000
  u1          ;; min subscription months
)
```

Users apply promo codes when subscribing:

```clarity
(contract-call? .billing subscribe-and-pay u1 .data-tracking u1)
;;                                                              ^-- promo-id
```

## Querying Billing State

```clarity
;; Check subscription details
(contract-call? .billing get-subscription-details 'USER_ADDRESS)

;; Check if payment is due
(contract-call? .billing is-payment-due 'USER_ADDRESS)

;; Get payment record
(contract-call? .billing get-payment-record u1)

;; Total revenue in STX
(contract-call? .billing get-total-revenue-in-stx)

;; User payment count
(contract-call? .billing get-user-payment-count 'USER_ADDRESS)

;; Grace period remaining (blocks)
(contract-call? .billing get-grace-period-remaining 'USER_ADDRESS)
```

## Error Codes

| Code | Constant | Meaning |
|------|----------|---------|
| u200 | err-owner-only | Caller is not contract owner |
| u201 | err-insufficient-funds | Insufficient STX balance |
| u202 | err-invalid-plan | Plan does not exist |
| u203 | err-payment-failed | STX transfer failed |
| u204 | err-no-subscription | User has no subscription |
| u205 | err-grace-period-expired | Grace period has ended |
| u206 | err-invalid-discount | Promo code is invalid or expired |
| u207 | err-contract-paused | Contract is paused |
| u208 | err-invalid-amount | Amount is invalid |
| u209 | err-already-cancelled | Subscription already cancelled |
