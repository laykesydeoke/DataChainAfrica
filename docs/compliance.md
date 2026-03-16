# Compliance Guide

DataChain Africa's blockchain-based data tracking supports regulatory compliance requirements.

## Audit Trail

Every data usage event is permanently stored on-chain with:
- User identifier
- Usage amount
- Timestamp (block height)
- Reporting carrier
- Remaining balance after usage

This provides a tamper-proof audit trail for regulatory review.

## Data Accuracy

Usage data reported by carriers is validated on-chain:
- Cannot exceed the user's remaining balance
- Must come from an authorized carrier
- Cannot occur on an expired plan

## Billing Transparency

All payment records include:
- User address
- Plan ID
- Amount paid
- Timestamp
- Discount applied

These are publicly verifiable by regulators.

## NDPC Considerations (Nigeria)

Under Nigeria's Data Protection Commission (NDPC) guidelines:
- User data is stored on a public blockchain
- Users must consent to on-chain data storage before subscribing
- The contract owner (mobile operator) is the data controller

## Reporting

Regulators can query data directly from the blockchain:

```clarity
;; Total data consumption for a user
(contract-call? .data-tracking get-user-data 'USER_ADDRESS)

;; Specific usage event
(contract-call? .data-tracking get-usage-event u1)

;; All payment records for a user (iterate by payment ID)
(contract-call? .billing get-payment-details u1)
```

## Carrier Accountability

Carriers authorized to report usage are tracked and their activity can be audited:

```clarity
(contract-call? .data-tracking get-carrier-stats 'CARRIER_ADDRESS)
```

This enables identification of:
- Which carrier reported excessive usage
- When a carrier last reported
- Total data reported by each carrier

## Grace Period Compliance

The grace period ensures users are not immediately cut off after billing failures. The default 144-block (~24hr) grace period aligns with NCC (Nigerian Communications Commission) fair usage guidelines.
