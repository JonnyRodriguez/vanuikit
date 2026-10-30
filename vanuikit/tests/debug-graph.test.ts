import { beforeEach, expect, test } from "bun:test";
import { van } from "../src/index.js";
import { installVanDebug } from "../src/debug-graph.js";

const debug = installVanDebug(van);

beforeEach(() => {
  debug.clear();
});

function kinds(): string[] {
  return debug.diagnostics().map((d) => d.kind);
}

test("instala una sola vez y devuelve la misma api", () => {
  expect(installVanDebug(van)).toBe(debug);
});

test("estado fuera de un marco no genera diagnósticos", () => {
  const s = van.state(0);
  expect(s.val).toBe(0);
  expect(debug.diagnostics()).toHaveLength(0);
});

test("R1: van.state() dentro de van.derive se detecta", () => {
  van.derive(() => {
    const inner = van.state(0);
    return inner.val;
  });
  expect(kinds()).toContain("state-in-derive");
});

test("el árbol registra las dependencias reales del derive", () => {
  const a = van.state(1);
  const b = van.state(2);
  const sum = van.derive(() => a.val + b.val);
  expect(sum.val).toBe(3);

  const graph = debug.dump();
  expect(graph.derives).toHaveLength(1);
  // a y b se crearon en orden: ids 1 y 2; el derive debe depender de ambos.
  expect([...graph.derives[0].deps].sort()).toEqual([1, 2]);
});

test("los estados envueltos conservan su semántica (recomputación)", async () => {
  const a = van.state(1);
  const d = van.derive(() => a.val * 2);
  expect(d.val).toBe(2);
  a.val = 5;
  // VanJS recomputa los derives en el siguiente microtask (updateDoms).
  await new Promise((r) => setTimeout(r, 0));
  expect(d.val).toBe(10);
});

test("R2: derive que escribe otro estado durante su cómputo se detecta", () => {
  const target = van.state(0);
  van.derive(() => {
    target.val = 1;
    return target.val;
  });
  expect(kinds()).toContain("derive-writes-state");
});

test("R2b: derive que lee y escribe el mismo estado se marca como ciclo", () => {
  const s = van.state(0);
  van.derive(() => {
    s.val = s.val + 1;
    return s.val;
  });
  expect(kinds()).toContain("derive-cycle");
});

test("R3: derive sin lecturas se detecta", () => {
  van.derive(() => 42);
  expect(kinds()).toContain("derive-no-deps");
});

test("R4: trackRender sobre función que lee estados reporta contenedor reactivo", () => {
  const c = van.state(1);
  debug.trackRender(() => {
    void c.val;
  });
  expect(kinds()).toContain("container-reactive-reads");
});

test("R4: renderIntentional suprime la advertencia", () => {
  const c = van.state(1);
  const f = debug.renderIntentional(() => {
    void c.val;
  });
  debug.trackRender(f);
  expect(kinds()).not.toContain("container-reactive-reads");
});

test("silent acumula sin imprimir y configure lo restaura", () => {
  debug.configure({ silent: true });
  van.derive(() => 42);
  expect(kinds()).toContain("derive-no-deps");
  debug.configure({ silent: false });
});
