import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
const deployer = simnet.deployer;

describe("api-gw unit test 1: queries entry", () => {
  it("queries entry for api-gw module", () => {
    const r=simnet.callReadOnlyFn("marketplace","get-api-gw-count",[],deployer);expect(r.result).toBeDefined();
  });
});
