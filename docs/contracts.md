# Smart Contract Reference

## billing.clar

### Public Functions

| Function | Parameters | Returns | Description |
|---|---|---|---|
| `set-paused` | `paused: bool` | `(ok bool)` | Pause or unpause the contract. Owner only. |
| `update-grace-period` | `blocks: uint` | `(ok bool)` | Update grace period in blocks. Owner only. |
| `set-promotional-rate` | `promo-id, discount, valid-blocks, min-months` | `(ok bool)` | Create or update a promo code. Owner only. |
| `subscribe-and-pay` | `plan-id, tracking-contract, promo-id` | `(ok bool)` | Subscribe to a plan and pay. |
| `process-renewal-payment` | `tracking-contract` | `(ok bool)` | Pay for a subscription renewal. |

### Read-only Functions

| Function | Returns | Description |
|---|---|---|
| `get-paused` | `bool` | Is the contract currently paused? |
| `get-subscription` | `(optional ...)` | Get user's subscription details. |
| `get-subscription-status` | `tuple` | Active status, days remaining, discount. |
| `get-grace-period` | `uint` | Current grace period in blocks. |
| `get-total-payments` | `uint` | Total payments processed. |
| `is-payment-due` | `bool` | Is a payment due for this user? |
| `is-promotion-valid` | `bool` | Is a promo code still valid? |

### Error Codes

| Code | Constant | Description |
|---|---|---|
| u200 | `err-owner-only` | Caller is not contract owner |
| u201 | `err-insufficient-funds` | Not enough STX to pay |
| u202 | `err-invalid-plan` | Plan does not exist |
| u203 | `err-payment-failed` | Payment transaction failed |
| u204 | `err-no-subscription` | User has no active subscription |
| u205 | `err-grace-period-expired` | Grace period has passed |
| u206 | `err-invalid-discount` | Discount percentage out of range |
| u207 | `err-contract-paused` | Contract is paused |
| u208 | `err-invalid-amount` | Amount is zero or invalid |

---

## data-tracking.clar

### Public Functions

| Function | Parameters | Returns | Description |
|---|---|---|---|
| `set-paused` | `paused: bool` | `(ok bool)` | Pause contract. Owner only. |
| `set-data-plan` | `plan-id, data-amount, duration-blocks, price` | `(ok bool)` | Create/update data plan. Owner only. |
| `deactivate-plan` | `plan-id` | `(ok bool)` | Retire a plan. Owner only. |
| `update-plan` | `plan-id, data-amount, duration-blocks, price` | `(ok bool)` | Update plan parameters. Owner only. |
| `authorize-carrier` | `carrier` | `(ok bool)` | Authorize a carrier. Owner only. |
| `revoke-carrier` | `carrier` | `(ok bool)` | Revoke a carrier. Owner only. |
| `subscribe-to-plan` | `plan-id, auto-renew` | `(ok bool)` | Subscribe user to a plan. |
| `record-usage` | `user, usage` | `(ok bool)` | Carrier records data usage event. |
| `process-plan-expiry` | `user` | `(ok bool)` | Process plan expiry and auto-renewal. |
| `get-usage` | `user` | `(response ...)` | Get user's usage data (trait fn). |
| `check-plan-validity` | `user` | `(response bool)` | Is user's plan still valid? |

### Error Codes

| Code | Description |
|---|---|
| u100 | Owner only |
| u101 | Unauthorized carrier |
| u102 | Invalid data / over balance |
| u103 | Plan expired |
| u104 | Plan already exists |
| u105 | Invalid plan |
| u106 | Contract paused |
| u107 | Plan is inactive |

---

## marketplace.clar

### Public Functions

| Function | Parameters | Returns | Description |
|---|---|---|---|
| `set-paused` | `paused: bool` | `(ok bool)` | Pause contract. Owner only. |
| `set-platform-fee` | `fee-pct: uint` | `(ok bool)` | Set fee % (0-10). Owner only. |
| `create-listing` | `data-amount, price, blocks-active, tracking-contract` | `(ok uint)` | Create a new data listing. |
| `cancel-listing` | `listing-id` | `(ok bool)` | Cancel an active listing. Seller only. |
| `purchase-listing` | `listing-id, tracking-contract` | `(ok bool)` | Purchase a listing. Cannot be seller. |

### Read-only Functions

| Function | Returns | Description |
|---|---|---|
| `get-paused` | `bool` | Is the contract paused? |
| `get-platform-fee` | `uint` | Current platform fee percent. |
| `get-platform-stats` | `tuple` | Total volume, trades, listings. |
| `get-listing` | `(optional ...)` | Get listing details by ID. |
| `get-listing-count` | `uint` | Total listings created. |
| `is-listing-active` | `bool` | Is a listing active and not expired? |

### Error Codes

| Code | Description |
|---|---|
| u300 | Owner only |
| u301 | Listing not found |
| u302 | Insufficient data balance |
| u303 | Listing expired or inactive |
| u304 | Not the seller |
| u305 | Insufficient funds |
| u306 | Contract paused |
| u307 | Invalid fee percentage |
| u308 | Cannot buy own listing |
