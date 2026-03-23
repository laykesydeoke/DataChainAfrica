import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
const deployer = simnet.deployer;

describe("error-handler unit test 1: queries entry", () => {
  it("queries entry for error-handler module", () => {
    const r=simnet.callReadOnlyFn("marketplace","get-error-handler-count",[],deployer);expect(r.result).toBeDefined();
  });
});
