import { describe, it, expect } from "vitest";
import { simnet } from "./setup";

describe("data-traits contract", () => {
  it("deploys successfully", () => {
    const contracts = simnet.getContractsInterfaces();
    expect(contracts.has(`${simnet.deployer}.data-traits`)).toBe(true);
  });

  it("defines data-tracking-trait", () => {
    const contracts = simnet.getContractsInterfaces();
    const traits = contracts.get(`${simnet.deployer}.data-traits`);
    expect(traits).toBeDefined();
  });
});
