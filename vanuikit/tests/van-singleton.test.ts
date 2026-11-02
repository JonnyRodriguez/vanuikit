import { describe, test, expect } from "bun:test";
import { guardSingleVan } from "../src/van-singleton.js";

const KEY = Symbol.for("vanuikit.vanjs-core.instance");

describe("guardSingleVan", () => {
  test("la misma instancia no avisa; una segunda copia grita en consola", () => {
    const g = globalThis as unknown as Record<symbol, unknown>;
    const original = g[KEY]; // la marca que dejó el import de src/index.ts
    delete g[KEY];

    const errors: unknown[] = [];
    const origError = console.error;
    console.error = (...args: unknown[]) => errors.push(args);
    try {
      const copiaA = { tags: "a" };
      const copiaB = { tags: "b" };

      guardSingleVan(copiaA); // primera copia: registra, sin aviso
      expect(errors.length).toBe(0);

      guardSingleVan(copiaA); // misma copia (re-import/ESM cache): sin aviso
      expect(errors.length).toBe(0);

      guardSingleVan(copiaB); // segunda copia: avisa con la solución
      expect(errors.length).toBe(1);
      const msg = String((errors[0] as unknown[])[0]);
      expect(msg).toContain("TWO copies"); // mensaje en inglés (consumidores npm)
      expect(msg).toContain('import { van } from "vanuikit"');
    } finally {
      console.error = origError;
      if (original !== undefined) g[KEY] = original; // no contaminar la suite
    }
  });

  test("la marca vive en el registro global (Symbol.for), visible para cualquier copia", () => {
    expect(Symbol.for("vanuikit.vanjs-core.instance")).toBe(
      Symbol.for("vanuikit.vanjs-core.instance"),
    );
  });
});
