# Security Model

DataChain Africa uses Clarity's built-in safety guarantees combined with contract-level access controls.

## Clarity Security Properties

### No Reentrancy
Clarity does not support recursive contract calls that could drain funds. Each function executes atomically.

### Decidability
All contract behaviors can be statically analyzed. No infinite loops, no dynamic dispatch vulnerabilities.

### Post-Conditions
Callers can assert that their STX balance changes by an exact amount before signing a transaction. This prevents unexpected fund drains.

## Access Control

### Contract Owner
The deployer address is captured as `contract-owner` at deployment time:
```clarity
(define-constant contract-owner tx-sender)
```

Only `contract-owner` can:
- Pause/unpause contracts
- Set platform fees
- Create/update data plans
- Authorize carriers
- Set promotional rates

### Authorized Carriers
Only carriers explicitly authorized by the contract owner can call `record-usage`. This prevents fake usage inflation.

### User Self-Sovereignty
Users can only modify their own subscription state:
- `cancel-subscription`: only affects `tx-sender`
- `set-auto-renew`: only affects `tx-sender`

Sellers can only modify listings they created:
- `cancel-listing`: requires `(is-eq (get seller listing) tx-sender)`
- `update-listing-price`: same check
- `extend-listing-duration`: same check

## Payment Safety

### STX Transfer Atomicity
Payments use `stx-transfer?` which is atomic. If it fails, the entire transaction reverts. No partial payment state is possible.

### Self-Purchase Prevention
The marketplace prevents circular trades:
```clarity
(asserts! (not (is-eq tx-sender (get seller listing))) (err err-self-purchase))
```

### Platform Fee Cap
The platform fee is capped at 10% to prevent extractive configurations:
```clarity
(asserts! (<= fee-pct u10) (err err-invalid-fee))
```

## Pause Mechanism

All three contracts implement an emergency pause:
```clarity
(define-data-var is-paused bool false)
(asserts! (not (var-get is-paused)) (err err-contract-paused))
```

This allows the contract owner to halt operations in case of a discovered vulnerability.

## Known Limitations

1. **Centralized Admin**: The contract owner has significant power. A future DAO upgrade would decentralize this.
2. **No Carrier Verification**: Carrier reports are trusted if authorized. Cryptographic signature verification is planned for V2.
3. **No Dispute Resolution**: Billing disputes must be handled off-chain currently.

## Audit Status

Pre-audit. The contracts are open-source at github.com/laykesydeoke/DataChainAfrica. Third-party audit planned before mainnet launch.
