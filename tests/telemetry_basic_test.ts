import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";

const deployer = simnet.deployer;
const wallet1 = simnet.getAccounts().get("wallet_1")!;

describe("basic telemetry functions", () => {
  it("telemetry snapshot returns all fields", () => {
    const snap = simnet.callReadOnlyFn(
      "data-tracking",
      "get-telemetry-snapshot",
      [],
      deployer
    );
    const data = (snap.result as any).value?.data;
    expect(data).toBeDefined();
    expect(data?.["total-data-recorded"]).toBeDefined();
    expect(data?.["total-unique-users"]).toBeDefined();
    expect(data?.["event-count"]).toBeDefined();
    expect(data?.["is-paused"]).toBeDefined();
  });

  it("telemetry snapshot is-paused is false by default", () => {
    const snap = simnet.callReadOnlyFn(
      "data-tracking",
      "get-telemetry-snapshot",
      [],
      deployer
    );
    const paused = (snap.result as any).value?.data?.["is-paused"]?.value;
    expect(paused).toBe(false);
  });

  it("user telemetry returns none before subscribe", () => {
    const result = simnet.callReadOnlyFn(
      "data-tracking",
      "get-user-telemetry",
      [Cl.principal(wallet1)],
      wallet1
    );
    expect(result.result).toBeNone();
  });
});
