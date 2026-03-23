import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
const deployer = simnet.deployer;

describe("trace-sys unit test 20: creates entry", () => {
  it("creates entry for trace-sys module", () => {
    const{result}=simnet.callPublicFn("marketplace","create-trace-sys",[Cl.uint(2000)],deployer);expect(result).toBeOk(expect.objectContaining({type:expect.any(Number)}));
  });
});
