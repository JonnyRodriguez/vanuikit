import { describe, test, expect } from "bun:test";
import { guardSingleVan } from "../src/van-singleton.js";

const KEY = Symbol.for("vanuikit.vanjs-core.instance");

describe("guardSingleVan", () => {
  test("same instance does not warn; a second copy shouts in console", () => {
    const g = globalThis as unknown as Record<symbol, unknown>;
    const original = g[KEY]; // the mark left by the src/index.ts import
    delete g[KEY];

    const errors: unknown[] = [];
    const origError = console.error;
    console.error = (...args: unknown[]) => errors.push(args);
    try {
      const copiaA = { tags: "a" };
      const copiaB = { tags: "b" };

      guardSingleVan(copiaA); // first copy: registers, no warning
      expect(errors.length).toBe(0);

      guardSingleVan(copiaA); // same copy (re-import/ESM cache): no warning
      expect(errors.length).toBe(0);

      guardSingleVan(copiaB); // second copy: warns with the solution
      expect(errors.length).toBe(1);
      const msg = String((errors[0] as unknown[])[0]);
      expect(msg).toContain("TWO copies"); // English message (npm consumers)
      expect(msg).toContain('import { van } from "vanuikit"');
    } finally {
      console.error = origError;
      if (original !== undefined) g[KEY] = original; // do not pollute the suite
    }
  });

  test("the mark lives in the global registry (Symbol.for), visible to any copy", () => {
    expect(Symbol.for("vanuikit.vanjs-core.instance")).toBe(
      Symbol.for("vanuikit.vanjs-core.instance"),
    );
  });
});
