# API Reference

Complete read-only and public function reference for DataChain Africa smart contracts.

## data-tracking.clar

### Public Functions

| Function | Args | Returns | Description |
|----------|------|---------|-------------|
| `set-paused` | `paused: bool` | `(ok bool)` | Pause/unpause (owner only) |
| `set-data-plan` | `plan-id, data-amount, duration-blocks, price` | `(ok bool)` | Create/update a plan |
| `deactivate-plan` | `plan-id: uint` | `(ok bool)` | Retire a plan |
| `subscribe-to-plan` | `plan-id: uint, auto-renew: bool` | `(ok bool)` | Subscribe to a data plan |
| `record-usage` | `user: principal, usage: uint` | `(ok bool)` | Report data usage |
| `process-plan-expiry` | `user: principal` | `(ok bool)` | Handle plan expiry/renewal |
| `set-auto-renew` | `enabled: bool` | `(ok bool)` | Toggle auto-renew |
| `authorize-carrier` | `carrier: principal` | `(ok bool)` | Authorize a carrier |
| `revoke-carrier` | `carrier: principal` | `(ok bool)` | Revoke carrier |
| `update-plan` | `plan-id, data-amount, duration-blocks, price` | `(ok bool)` | Update plan details |

### Read-Only Functions

| Function | Args | Returns |
|----------|------|---------|
| `get-paused` | — | `bool` |
| `get-user-data` | `user: principal` | `(optional {...})` |
| `get-plan-details` | `plan-id: uint` | `(optional {...})` |
| `get-usage-event` | `event-id: uint` | `(optional {...})` |
| `get-latest-event-id` | — | `uint` |
| `get-total-plans` | — | `uint` |
| `is-carrier-authorized` | `carrier: principal` | `bool` |
| `get-total-data-recorded` | — | `uint` |
| `get-total-unique-users` | — | `uint` |
| `get-network-summary` | — | `{total-data-recorded, total-unique-users, total-events, total-plans}` |
| `get-carrier-stats` | `carrier: principal` | `{total-usage-reported, total-events, last-report-block}` |
| `get-carrier-total-usage` | `carrier: principal` | `uint` |
| `has-active-subscription` | `user: principal` | `bool` |

---

## billing.clar

### Public Functions

| Function | Args | Returns |
|----------|------|---------|
| `set-paused` | `paused: bool` | `(ok bool)` |
| `subscribe-and-pay` | `plan-id, tracking-contract, promo-id` | `(ok bool)` |
| `process-renewal-payment` | `tracking-contract` | `(ok bool)` |
| `cancel-subscription` | — | `(ok bool)` |
| `set-promotional-rate` | `promo-id, discount, valid-until, min-months` | `(ok bool)` |
| `update-grace-period` | `new-period: uint` | `(ok bool)` |

### Read-Only Functions

| Function | Args | Returns |
|----------|------|---------|
| `get-paused` | — | `bool` |
| `get-subscription-details` | `user: principal` | `(optional {...})` |
| `is-payment-due` | `user: principal` | `bool` |
| `get-total-payments` | — | `uint` |
| `get-total-revenue` | — | `uint` |
| `get-total-subscribers` | — | `uint` |
| `get-user-payment-count` | `user: principal` | `uint` |
| `get-platform-summary` | — | `{total-revenue, total-subscribers, total-payments}` |
| `get-subscription-age` | `user: principal` | `uint` |
| `get-subscription-plan` | `user: principal` | `(optional uint)` |
| `get-user-discount` | `user: principal` | `uint` |

---

## marketplace.clar

### Public Functions

| Function | Args | Returns |
|----------|------|---------|
| `set-paused` | `paused: bool` | `(ok bool)` |
| `create-listing` | `data-amount, price, duration` | `(ok uint)` |
| `purchase-listing` | `listing-id, tracking-contract` | `(ok bool)` |
| `cancel-listing` | `listing-id: uint` | `(ok bool)` |
| `update-listing-price` | `listing-id, new-price` | `(ok bool)` |
| `extend-listing-duration` | `listing-id, extra-blocks` | `(ok bool)` |
| `set-platform-fee` | `fee-pct: uint` | `(ok bool)` |

### Read-Only Functions

| Function | Args | Returns |
|----------|------|---------|
| `get-paused` | — | `bool` |
| `get-listing` | `listing-id: uint` | `(optional {...})` |
| `get-listing-count` | — | `uint` |
| `get-platform-stats` | — | `{total-volume, total-trades, total-listings}` |
| `get-buyer-stats` | `user: principal` | `{total-purchases, total-data-bought, total-spent}` |
| `get-seller-stats` | `seller: principal` | `{total-sales, total-data-sold, active-listings}` |
| `get-seller-revenue` | `seller: principal` | `uint` |
| `is-listing-active` | `listing-id: uint` | `bool` |
| `get-user-active-listings` | `user: principal` | `uint` |

---

## Error Codes

See `docs/error-codes.md` for a full list of error constants.
