import { initSimnet } from "@hirosystems/clarinet-sdk";
import { expect } from "vitest";
import { Cl, ClarityValue } from "@stacks/transactions";

const simnet = await initSimnet();
export { simnet };

// Custom Clarity matchers for vitest
expect.extend({
  toBeOk(received: ClarityValue, expected?: ClarityValue) {
    const pass =
      received.type === 7 &&
      (expected === undefined ||
        JSON.stringify(received) === JSON.stringify(Cl.ok(expected)));
    return {
      pass,
      message: () =>
        `expected ${JSON.stringify(received)} ${pass ? "not " : ""}to be (ok ${
          expected ? JSON.stringify(expected) : "..."
        })`,
    };
  },
  toBeErr(received: ClarityValue, expected?: ClarityValue) {
    const pass =
      received.type === 8 &&
      (expected === undefined ||
        JSON.stringify(received) === JSON.stringify(Cl.error(expected)));
    return {
      pass,
      message: () =>
        `expected ${JSON.stringify(received)} ${pass ? "not " : ""}to be (err ${
          expected ? JSON.stringify(expected) : "..."
        })`,
    };
  },
  toBeSome(received: ClarityValue, expected?: ClarityValue) {
    const pass =
      received.type === 10 &&
      (expected === undefined ||
        JSON.stringify(received) === JSON.stringify(Cl.some(expected)));
    return {
      pass,
      message: () =>
        `expected ${JSON.stringify(received)} ${pass ? "not " : ""}to be (some ...)`,
    };
  },
  toBeNone(received: ClarityValue) {
    const pass = received.type === 9;
    return {
      pass,
      message: () =>
        `expected ${JSON.stringify(received)} ${pass ? "not " : ""}to be none`,
    };
  },
  toBeBool(received: ClarityValue, expected: boolean) {
    const pass = JSON.stringify(received) === JSON.stringify(Cl.bool(expected));
    return {
      pass,
      message: () =>
        `expected ${JSON.stringify(received)} ${pass ? "not " : ""}to be bool(${expected})`,
    };
  },
  toBeUint(received: ClarityValue, expected: number | bigint) {
    const pass = JSON.stringify(received) === JSON.stringify(Cl.uint(expected));
    return {
      pass,
      message: () =>
        `expected ${JSON.stringify(received)} ${pass ? "not " : ""}to be uint(${expected})`,
    };
  },
  toBeInt(received: ClarityValue, expected: number | bigint) {
    const pass = JSON.stringify(received) === JSON.stringify(Cl.int(expected));
    return {
      pass,
      message: () =>
        `expected ${JSON.stringify(received)} ${pass ? "not " : ""}to be int(${expected})`,
    };
  },
  toBeTuple(received: ClarityValue, expected: Record<string, ClarityValue>) {
    const pass = JSON.stringify(received) === JSON.stringify(Cl.tuple(expected));
    return {
      pass,
      message: () =>
        `expected ${JSON.stringify(received)} ${pass ? "not " : ""}to be tuple(${JSON.stringify(expected)})`,
    };
  },
});
