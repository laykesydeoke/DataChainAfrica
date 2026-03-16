# Frequently Asked Questions

## General

**What is DataChain Africa?**
DataChain Africa is a blockchain-based system for tracking and billing mobile data usage in Nigeria. Built on the Stacks ecosystem, it uses Clarity smart contracts to provide transparent, tamper-proof data accounting.

**Why build this on Stacks?**
Stacks anchors to Bitcoin for security while enabling smart contract logic through Clarity. Clarity's decidability ensures contracts behave predictably — no reentrancy, no hidden state. This makes it ideal for financial applications like mobile data billing.

**What network does this run on?**
Currently deployed on Stacks testnet. Mainnet deployment follows full carrier integration and audit.

---

## Subscriptions

**How do I subscribe to a data plan?**
Connect your Hiro Wallet and click "Subscribe" on any plan. This triggers `subscribe-and-pay` in the billing contract, which charges STX and activates your plan.

**Can I cancel my subscription?**
Yes. Call `cancel-subscription` through the dApp. Your subscription remains active until the grace period ends (default: 144 blocks, ~1 day).

**What happens when my plan expires?**
If auto-renew is enabled, your plan renews and unused data rolls over. If disabled, your balance resets to zero and you must re-subscribe.

**What is the grace period?**
A configurable window (in blocks) after a subscription lapses during which you can renew without losing access. The default is 144 blocks (~1 day).

---

## Marketplace

**How do I list data for sale?**
You need an active subscription with available balance. Use the marketplace section to specify the amount (MB), price (STX), and duration. This calls `create-listing`.

**Can I buy my own listing?**
No. The contract enforces `err-self-purchase (u308)` to prevent circular transactions.

**What is the platform fee?**
A percentage of each trade deducted from the buyer's payment. Default: 2%, maximum: 10%. The fee goes to the contract owner.

**Can I update the price of my listing?**
Yes. Use `update-listing-price` while the listing is still active. Only the original seller can do this.

---

## Payments & STX

**What is STX?**
STX is the native token of the Stacks network. It is used to pay for subscriptions and data purchases on DataChain Africa.

**Where can I get testnet STX?**
Use the Hiro faucet at `https://explorer.hiro.so/sandbox/faucet` to receive free testnet STX.

**How is payment processed?**
Payments use Clarity's `stx-transfer?` function, which atomically moves STX from the buyer to the recipient. If the transfer fails, the entire transaction reverts.

---

## Technical

**What version of Clarity is used?**
Clarity 4 (Stacks 3.0+), which supports `stacks-block-height` and other modern builtins.

**How are tests run?**
Using `@hirosystems/clarinet-sdk` with Vitest. Run `npm test` to execute all test suites.

**Is the contract audited?**
Not yet. A third-party audit is planned before mainnet deployment. The contracts are fully open-source at github.com/laykesydeoke/DataChainAfrica.
