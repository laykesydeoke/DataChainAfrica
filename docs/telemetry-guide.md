# Telemetry Guide

DataChain Africa provides comprehensive on-chain telemetry for operators, regulators, and analytics platforms.

## Network Telemetry

### `get-telemetry-snapshot` (data-tracking)

Returns a point-in-time snapshot of the entire network:

```clarity
(contract-call? .data-tracking get-telemetry-snapshot)
```

Returns:
```
{
  total-data-recorded: uint,   ;; MB recorded network-wide
  total-unique-users: uint,    ;; unique subscriber addresses
  event-count: uint,           ;; total usage events
  is-paused: bool              ;; contract pause state
}
```

### `get-network-stats`

Full network statistics including data and subscriber counts.

### `get-network-summary`

Compact summary suitable for dashboards.

## User Telemetry

### `get-user-telemetry` (data-tracking)

Per-user data snapshot:

```clarity
(contract-call? .data-tracking get-user-telemetry 'USER_ADDRESS)
```

Returns:
```
{
  total-data-used: uint,    ;; cumulative MB used
  data-balance: uint,       ;; remaining MB in plan
  plan-expiry: uint,        ;; block height of expiry
  last-updated: uint        ;; block height of last update
}
```

## Billing Telemetry

### `get-billing-telemetry` (billing)

```clarity
(contract-call? .billing get-billing-telemetry)
```

Returns:
```
{
  total-payments: uint,           ;; total payment transactions
  total-revenue-ustx: uint,       ;; revenue in microSTX
  total-revenue-stx: uint,        ;; revenue in STX
  is-paused: bool,                ;; billing pause state
  grace-period-blocks: uint       ;; current grace period setting
}
```

## Carrier Telemetry

Track individual carrier performance:

```clarity
(contract-call? .data-tracking get-carrier-stats 'CARRIER_ADDRESS)
```

Useful for identifying over-reporting or under-performing carriers.

## Integration

For automated telemetry polling, see `.env.example` for configuration keys including `TELEMETRY_REFRESH_MS` and `TELEMETRY_EXPORT_ENABLED`.
