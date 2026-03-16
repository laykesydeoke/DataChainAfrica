# Contributing to DataChain Africa

Thank you for your interest in contributing!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/DataChainAfrica.git`
3. Install dependencies: `npm install`
4. Create a feature branch: `git checkout -b feat/your-feature`

## Development Setup

Ensure you have the following installed:

- Node.js v18+
- [Clarinet](https://docs.hiro.so/clarinet/getting-started) v2+
- Git

Check contracts compile:
```bash
clarinet check
```

Run full test suite:
```bash
npm test
```

## Submitting Changes

1. Keep each commit focused on a single change
2. Write descriptive commit messages (max 72 chars)
3. Ensure all tests pass before opening a PR
4. Open a pull request against the `main` branch
5. Fill in the PR template

## Writing Tests

Tests live in `tests/` and use Clarinet SDK + Vitest.

Each contract function should have:
- A happy-path test
- An error/edge-case test
- An authorization test (if applicable)

Example test structure:
```typescript
import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

describe("feature name", () => {
  it("does something expected", () => {
    const result = simnet.callPublicFn(
      "contract-name",
      "function-name",
      [Cl.uint(1)],
      simnet.deployer
    );
    expect(result.result).toBeOk(Cl.bool(true));
  });
});
```

## Smart Contract Guidelines

- Use `stacks-block-height` for time-sensitive logic
- Validate all inputs at function entry with `asserts!`
- Return descriptive error codes (see `docs/error-codes.md`)
- Prefer `map-get?` + `match` over `unwrap-panic`
- Update counters for any new indexed entity

## Code Style

- Clarity: 4-space indentation, lowercase kebab-case identifiers
- TypeScript tests: camelCase, explicit types preferred
- JavaScript frontend: vanilla JS, no frameworks

## Reporting Issues

Open an issue on GitHub with:
- Steps to reproduce
- Expected vs actual behavior
- Contract/function name involved
- Relevant error code if applicable

## License

MIT — see LICENSE file for details.
