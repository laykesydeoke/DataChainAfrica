# Metrics Reference

Key metrics and their on-chain sources for DataChain Africa monitoring.

## Network Health Metrics

### Data Consumption Rate
- **Source**: `get-total-data-recorded` over time
- **Use case**: Track network-wide data consumption trends
- **Alert threshold**: >90% of projected capacity

### Active Subscribers
- **Source**: `get-total-unique-users`
- **Use case**: Subscriber growth tracking
- **Billing implication**: Revenue forecast

### Event Processing Rate
- **Source**: `get-event-counter` delta per block
- **Use case**: Carrier activity monitoring
- **Alert threshold**: 0 events/block during peak hours

## Plan Performance Metrics

### Plan Uptake
- **Source**: Count users per `get-user-plan-type`
- **Use case**: Identify most popular plans
- **Action**: Adjust pricing or introduce new tiers

### Auto-Renewal Rate
- **Source**: `get-user-auto-renew` across subscribers
- **Use case**: Churn prediction
- **Insight**: Low auto-renew = high churn risk

## Billing Metrics

### Revenue Per Block
- **Source**: `get-total-revenue-in-stx` delta
- **Use case**: Daily/weekly revenue reporting

### Payment Success Rate
- **Source**: `get-total-payments` vs subscription attempts
- **Use case**: Identify billing failures

### Grace Period Utilization
- **Source**: `get-grace-period-remaining` > 0
- **Use case**: Identify users at risk of lapsing

## Carrier Metrics

### Carrier Reporting Frequency
- **Source**: `get-carrier-stats`.`last-report-block` delta
- **Alert**: No report in >12 blocks

### Carrier Data Volume
- **Source**: `get-carrier-total-usage`
- **Use case**: Billing reconciliation with carriers

## Marketplace Metrics

### Trading Volume
- **Source**: `get-platform-stats`.`total-volume`
- **Use case**: Marketplace health indicator

### Listing Activity
- **Source**: `get-listing-counter` delta
- **Use case**: Track peer trading activity
