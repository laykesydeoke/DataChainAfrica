# Error Code Reference

All DataChain Africa contracts return typed errors using Clarity's `(err uint)` pattern.

## data-tracking.clar (u1xx)

| Code | Constant | Description |
|------|----------|-------------|
| u100 | `err-owner-only` | Caller is not the contract owner |
| u101 | `err-invalid-caller` | Caller is not an authorized carrier |
| u102 | `err-invalid-data` | User has no data plan, or usage exceeds balance |
| u103 | `err-expired-plan` | User's data plan has expired |
| u104 | `err-plan-exists` | Plan ID already in use (reserved) |
| u105 | `err-invalid-plan` | Plan ID does not exist |
| u106 | `err-contract-paused` | Contract is paused by admin |
| u107 | `err-plan-inactive` | Plan is deactivated, cannot subscribe |

## billing.clar (u2xx)

| Code | Constant | Description |
|------|----------|-------------|
| u200 | `err-owner-only` | Caller is not the contract owner |
| u201 | `err-insufficient-funds` | STX transfer failed |
| u202 | `err-invalid-plan` | Plan not found in tracking contract |
| u203 | `err-payment-failed` | Payment could not be processed |
| u204 | `err-no-subscription` | User has no subscription record |
| u205 | `err-grace-period-expired` | Grace period has elapsed, cannot renew |
| u206 | `err-invalid-discount` | Discount percentage exceeds 100% |
| u207 | `err-contract-paused` | Contract is paused by admin |
| u208 | `err-invalid-amount` | Amount is zero or invalid |
| u209 | `err-already-cancelled` | Subscription is already cancelled |

## marketplace.clar (u3xx)

| Code | Constant | Description |
|------|----------|-------------|
| u300 | `err-owner-only` | Caller is not the contract owner |
| u301 | `err-invalid-listing` | Listing ID does not exist |
| u302 | `err-insufficient-data` | Seller's data balance < listing amount |
| u303 | `err-listing-expired` | Listing is inactive or past expiry block |
| u304 | `err-not-seller` | Caller is not the listing's creator |
| u305 | `err-insufficient-funds` | Buyer has insufficient STX |
| u306 | `err-contract-paused` | Contract is paused by admin |
| u307 | `err-invalid-fee` | Platform fee exceeds 10% cap |
| u308 | `err-self-purchase` | Buyer and seller are the same address |

## Handling Errors in Frontend

```javascript
function handleContractError(errorCode) {
  const messages = {
    200: 'Only the contract owner can do this',
    204: 'No subscription found',
    207: 'This feature is temporarily paused',
    301: 'Listing not found',
    305: 'Insufficient STX balance',
    308: 'You cannot purchase your own listing',
  };
  return messages[errorCode] || `Contract error: u${errorCode}`;
}
```

## Handling Errors in TypeScript Tests

```typescript
expect(result).toBeErr(Cl.uint(207)); // Contract paused
expect(result).toBeErr(Cl.uint(304)); // Not seller
```
