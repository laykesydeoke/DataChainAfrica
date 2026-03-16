# Reporting API Reference

This document details all read-only contract functions available for building reports and dashboards.

## Data Tracking Contract

| Function | Arguments | Returns | Description |
|----------|-----------|---------|-------------|
| `get-telemetry-snapshot` | none | tuple | Full network snapshot |
| `get-user-telemetry` | `user principal` | optional tuple | Per-user metrics |
| `get-network-stats` | none | tuple | Detailed network stats |
| `get-network-summary` | none | tuple | Compact summary |
| `get-total-data-recorded` | none | uint | Network-wide MB total |
| `get-total-unique-users` | none | uint | Unique subscriber count |
| `get-event-counter` | none | uint | Total usage events |
| `get-carrier-stats` | `carrier principal` | tuple | Carrier performance |
| `get-carrier-total-usage` | `carrier principal` | uint | Carrier MB total |
| `get-usage-event` | `event-id uint` | optional tuple | Individual event |
| `get-user-data` | `user principal` | optional tuple | Full user record |
| `has-active-subscription` | `user principal` | bool | Active subscription check |
| `get-plan-expiry` | `user principal` | optional uint | Plan expiry block |
| `get-user-plan-type` | `user principal` | optional uint | Plan ID |
| `get-user-auto-renew` | `user principal` | optional bool | Auto-renew setting |

## Billing Contract

| Function | Arguments | Returns | Description |
|----------|-----------|---------|-------------|
| `get-billing-telemetry` | none | tuple | Full billing snapshot |
| `get-total-payments` | none | uint | Total payment count |
| `get-total-revenue-in-stx` | none | uint | Revenue in STX |
| `get-payment-details` | `payment-id uint` | optional tuple | Payment record |
| `get-payment-record` | `payment-id uint` | optional tuple | Alias for above |
| `get-grace-period-remaining` | `user principal` | uint | Blocks until grace ends |
| `get-subscription-age` | `user principal` | uint | Blocks since subscribe |
| `get-subscription-plan` | `user principal` | optional uint | User's plan ID |
| `get-user-discount` | `user principal` | uint | Discount rate |
| `get-user-payment-count` | `user principal` | uint | User payment count |

## Marketplace Contract

| Function | Arguments | Returns | Description |
|----------|-----------|---------|-------------|
| `get-platform-stats` | none | tuple | Marketplace stats |
| `get-marketplace-summary` | none | tuple | Summary view |
| `get-listing-counter` | none | uint | Total listings |
| `get-listing` | `listing-id uint` | optional tuple | Listing details |
| `get-seller-stats` | `seller principal` | tuple | Seller performance |
| `get-seller-revenue` | `seller principal` | uint | Seller STX earned |
| `get-total-data-sold` | `seller principal` | uint | Seller MB sold |
