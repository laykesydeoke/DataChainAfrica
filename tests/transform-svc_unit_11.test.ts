import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
const deployer = simnet.deployer;

describe("transform-svc unit test 11: queries entry", () => {
  it("queries entry for transform-svc module", () => {
    const r=simnet.callReadOnlyFn("marketplace","get-transform-svc-count",[],deployer);expect(r.result).toBeDefined();
  });
});
