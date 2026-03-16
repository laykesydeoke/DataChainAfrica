# Stacks & Clarity Overview

DataChain Africa is built on the Stacks blockchain using Clarity smart contracts. This document explains the key Stacks concepts used throughout the project.

## What is Stacks?

Stacks is a layer-1 blockchain that settles transactions on Bitcoin. It extends Bitcoin's capabilities with smart contract functionality via the Clarity programming language. Stacks blocks are produced approximately every 10 minutes, aligned with Bitcoin blocks.

## What is Clarity?

Clarity is a decidable, interpreted smart contract language. Key properties:

- **No reentrancy**: Contracts cannot call back into themselves mid-execution
- **Decidable**: All possible contract behaviors can be analyzed statically
- **Interpreted**: Contracts run as-is on the blockchain, not compiled bytecode
- **Post-conditions**: Callers can assert STX balance changes before signing

## Key Concepts Used

### stacks-block-height
Used throughout DataChain Africa to timestamp events and set expiry windows:
```clarity
plan-expiry: (+ stacks-block-height (get duration-blocks plan))
```

### STX Transfers
The native token STX is transferred using:
```clarity
(stx-transfer? amount sender recipient)
```
This is an atomic operation — it either succeeds or fails entirely.

### Principals
Every Stacks address is a `principal`. Contracts and wallets are both principals:
```clarity
(define-constant contract-owner tx-sender)  ;; wallet address
Cl.contractPrincipal(deployer, "billing")   ;; contract address
```

### Traits
Traits define interfaces for cross-contract calls. DataChain Africa uses traits to allow billing.clar to call data-tracking.clar without hardcoding the address:
```clarity
(use-trait data-tracking-trait .data-traits.data-tracking-trait)
```

### Maps
On-chain key-value storage. DataChain Africa uses maps extensively:
```clarity
(define-map user-subscriptions { user: principal } { ... })
(map-set user-subscriptions { user: tx-sender } { ... })
(map-get? user-subscriptions { user: tx-sender })
```

### Data Vars
Single-value mutable storage for counters and state:
```clarity
(define-data-var payment-counter uint u0)
(var-set payment-counter (+ (var-get payment-counter) u1))
```

## Testing with Clarinet SDK

The Clarinet SDK boots a local simnet for testing:
```typescript
const simnet = await initSimnet();
simnet.callPublicFn("contract", "function", [Cl.uint(1)], deployer);
simnet.callReadOnlyFn("contract", "getter", [], caller);
```

## Useful Resources

- [Stacks Docs](https://docs.stacks.co)
- [Clarity Language Docs](https://docs.stacks.co/clarity)
- [Hiro Platform](https://platform.hiro.so)
- [Clarinet](https://github.com/hirosystems/clarinet)
