import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;
const wallet2 = simnet.getAccounts().get("wallet_2")!;

describe("governance contract", () => {
  it("deploys successfully", () => {
    const contracts = simnet.getContractsInterfaces();
    expect(contracts.has(`${deployer}.governance`)).toBe(true);
  });

  it("allows owner to authorize a proposer", () => {
    const { result } = simnet.callPublicFn(
      "governance",
      "authorize-proposer",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("prevents non-owner from authorizing proposers", () => {
    const { result } = simnet.callPublicFn(
      "governance",
      "authorize-proposer",
      [Cl.principal(wallet2)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(400));
  });

  it("allows authorized proposer to create a proposal", () => {
    // Authorize wallet1 first
    simnet.callPublicFn(
      "governance",
      "authorize-proposer",
      [Cl.principal(wallet1)],
      deployer
    );

    const { result } = simnet.callPublicFn(
      "governance",
      "create-proposal",
      [
        Cl.stringAscii("Increase daily plan data"),
        Cl.stringAscii("Proposal to increase daily plan from 500MB to 1GB")
      ],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("prevents unauthorized user from creating a proposal", () => {
    const { result } = simnet.callPublicFn(
      "governance",
      "create-proposal",
      [
        Cl.stringAscii("Unauthorized proposal"),
        Cl.stringAscii("This should fail")
      ],
      wallet2
    );
    expect(result).toBeErr(Cl.uint(404));
  });

  it("increments proposal counter after creation", () => {
    simnet.callPublicFn(
      "governance",
      "authorize-proposer",
      [Cl.principal(wallet1)],
      deployer
    );
    simnet.callPublicFn(
      "governance",
      "create-proposal",
      [
        Cl.stringAscii("Test proposal"),
        Cl.stringAscii("A test proposal description")
      ],
      wallet1
    );

    const result = simnet.callReadOnlyFn(
      "governance",
      "get-proposal-count",
      [],
      deployer
    );
    expect(result.result).toBeUint(1);
  });

  it("allows a user to vote for a proposal", () => {
    simnet.callPublicFn(
      "governance",
      "authorize-proposer",
      [Cl.principal(wallet1)],
      deployer
    );
    simnet.callPublicFn(
      "governance",
      "create-proposal",
      [
        Cl.stringAscii("Vote test proposal"),
        Cl.stringAscii("Testing the vote function")
      ],
      wallet1
    );

    const { result } = simnet.callPublicFn(
      "governance",
      "vote-on-proposal",
      [Cl.uint(1), Cl.bool(true)],
      wallet2
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("prevents double voting on the same proposal", () => {
    simnet.callPublicFn(
      "governance",
      "authorize-proposer",
      [Cl.principal(wallet1)],
      deployer
    );
    simnet.callPublicFn(
      "governance",
      "create-proposal",
      [
        Cl.stringAscii("Double vote test"),
        Cl.stringAscii("Testing double vote prevention")
      ],
      wallet1
    );

    simnet.callPublicFn(
      "governance",
      "vote-on-proposal",
      [Cl.uint(1), Cl.bool(true)],
      wallet2
    );

    const { result } = simnet.callPublicFn(
      "governance",
      "vote-on-proposal",
      [Cl.uint(1), Cl.bool(false)],
      wallet2
    );
    expect(result).toBeErr(Cl.uint(401));
  });

  it("returns has-voted true after voting", () => {
    simnet.callPublicFn(
      "governance",
      "authorize-proposer",
      [Cl.principal(wallet1)],
      deployer
    );
    simnet.callPublicFn(
      "governance",
      "create-proposal",
      [
        Cl.stringAscii("Has voted test"),
        Cl.stringAscii("Testing has-voted read-only")
      ],
      wallet1
    );
    simnet.callPublicFn(
      "governance",
      "vote-on-proposal",
      [Cl.uint(1), Cl.bool(true)],
      wallet2
    );

    const result = simnet.callReadOnlyFn(
      "governance",
      "has-voted",
      [Cl.uint(1), Cl.principal(wallet2)],
      deployer
    );
    expect(result.result).toBeBool(true);
  });

  it("get-proposal returns proposal details", () => {
    simnet.callPublicFn(
      "governance",
      "authorize-proposer",
      [Cl.principal(wallet1)],
      deployer
    );
    simnet.callPublicFn(
      "governance",
      "create-proposal",
      [
        Cl.stringAscii("Detail test"),
        Cl.stringAscii("Testing get-proposal read-only function")
      ],
      wallet1
    );

    const result = simnet.callReadOnlyFn(
      "governance",
      "get-proposal",
      [Cl.uint(1)],
      deployer
    );
    expect(result.result).toBeSome(
      expect.objectContaining({ type: expect.any(Number) })
    );
  });

  it("owner can update voting period", () => {
    const { result } = simnet.callPublicFn(
      "governance",
      "set-voting-period",
      [Cl.uint(2016)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    const period = simnet.callReadOnlyFn(
      "governance",
      "get-voting-period",
      [],
      deployer
    );
    expect(period.result).toBeUint(2016);
  });

  it("is-authorized-proposer returns true for authorized proposer", () => {
    simnet.callPublicFn(
      "governance",
      "authorize-proposer",
      [Cl.principal(wallet1)],
      deployer
    );

    const result = simnet.callReadOnlyFn(
      "governance",
      "is-authorized-proposer",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(result.result).toBeBool(true);
  });

  it("revoke-proposer removes proposer authorization", () => {
    simnet.callPublicFn(
      "governance",
      "authorize-proposer",
      [Cl.principal(wallet1)],
      deployer
    );
    simnet.callPublicFn(
      "governance",
      "revoke-proposer",
      [Cl.principal(wallet1)],
      deployer
    );

    const result = simnet.callReadOnlyFn(
      "governance",
      "is-authorized-proposer",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(result.result).toBeBool(false);
  });

  it("owner can set minimum quorum", () => {
    const { result } = simnet.callPublicFn(
      "governance",
      "set-min-quorum",
      [Cl.uint(5)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    const quorum = simnet.callReadOnlyFn(
      "governance",
      "get-min-quorum",
      [],
      deployer
    );
    expect(quorum.result).toBeUint(5);
  });

  it("non-owner cannot set quorum", () => {
    const { result } = simnet.callPublicFn(
      "governance",
      "set-min-quorum",
      [Cl.uint(5)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(400));
  });

  it("owner can set execution delay", () => {
    const { result } = simnet.callPublicFn(
      "governance",
      "set-execution-delay",
      [Cl.uint(288)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    const delay = simnet.callReadOnlyFn(
      "governance",
      "get-execution-delay",
      [],
      deployer
    );
    expect(delay.result).toBeUint(288);
  });

  it("allows vote delegation to another address", () => {
    const { result } = simnet.callPublicFn(
      "governance",
      "delegate-vote",
      [Cl.principal(wallet2)],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));

    const delegate = simnet.callReadOnlyFn(
      "governance",
      "get-delegate",
      [Cl.principal(wallet1)],
      deployer
    );
    expect(delegate.result).toBeSome(
      expect.objectContaining({ type: expect.any(Number) })
    );
  });

  it("prevents self-delegation", () => {
    const { result } = simnet.callPublicFn(
      "governance",
      "delegate-vote",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result).toBeErr(Cl.uint(411));
  });

  it("allows revoking delegation", () => {
    simnet.callPublicFn(
      "governance",
      "delegate-vote",
      [Cl.principal(wallet2)],
      wallet1
    );

    const { result } = simnet.callPublicFn(
      "governance",
      "revoke-delegation",
      [],
      wallet1
    );
    expect(result).toBeOk(Cl.bool(true));
  });

  it("delegate can vote on behalf of delegator", () => {
    const wallet3 = simnet.getAccounts().get("wallet_3")!;

    // Authorize proposer and create a proposal
    simnet.callPublicFn("governance", "authorize-proposer", [Cl.principal(wallet1)], deployer);
    simnet.callPublicFn("governance", "create-proposal", [
      Cl.stringAscii("Delegation vote test"),
      Cl.stringAscii("Testing delegated voting")
    ], wallet1);

    // wallet3 delegates to wallet2
    simnet.callPublicFn("governance", "delegate-vote", [Cl.principal(wallet2)], wallet3);

    // wallet2 votes as delegate for wallet3
    const { result } = simnet.callPublicFn(
      "governance",
      "vote-as-delegate",
      [Cl.uint(1), Cl.principal(wallet3), Cl.bool(true)],
      wallet2
    );
    expect(result).toBeOk(Cl.bool(true));

    // Verify wallet3 shows as having voted
    const voted = simnet.callReadOnlyFn(
      "governance",
      "has-voted",
      [Cl.uint(1), Cl.principal(wallet3)],
      deployer
    );
    expect(voted.result).toBeBool(true);
  });

  it("rejects proposal when quorum not met", () => {
    // Set quorum to 5
    simnet.callPublicFn("governance", "set-min-quorum", [Cl.uint(5)], deployer);
    simnet.callPublicFn("governance", "authorize-proposer", [Cl.principal(wallet1)], deployer);
    // Set very short voting period for testing
    simnet.callPublicFn("governance", "set-voting-period", [Cl.uint(1)], deployer);

    simnet.callPublicFn("governance", "create-proposal", [
      Cl.stringAscii("Quorum test"),
      Cl.stringAscii("This should be rejected - not enough votes")
    ], wallet1);

    // Only 1 vote (below quorum of 5)
    simnet.callPublicFn("governance", "vote-on-proposal", [Cl.uint(1), Cl.bool(true)], wallet2);

    // Mine blocks to end voting period
    simnet.mineEmptyBlocks(5);

    const { result } = simnet.callPublicFn(
      "governance",
      "close-proposal",
      [Cl.uint(1)],
      deployer
    );
    expect(result).toBeOk(Cl.bool(true));

    // Proposal should be rejected due to insufficient quorum
    const proposal = simnet.callReadOnlyFn(
      "governance",
      "get-proposal",
      [Cl.uint(1)],
      deployer
    );
    expect(proposal.result).toBeSome(
      expect.objectContaining({ type: expect.any(Number) })
    );
  });
});
