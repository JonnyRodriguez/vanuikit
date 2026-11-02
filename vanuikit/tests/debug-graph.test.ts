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

test("installs once and returns the same api", () => {
  expect(installVanDebug(van)).toBe(debug);
});

test("state outside a frame produces no diagnostics", () => {
  const s = van.state(0);
  expect(s.val).toBe(0);
  expect(debug.diagnostics()).toHaveLength(0);
});

test("R1: van.state() inside van.derive is detected", () => {
  van.derive(() => {
    const inner = van.state(0);
    return inner.val;
  });
  expect(kinds()).toContain("state-in-derive");
});

test("the graph records the derive's real dependencies", () => {
  const a = van.state(1);
  const b = van.state(2);
  const sum = van.derive(() => a.val + b.val);
  expect(sum.val).toBe(3);

  const graph = debug.dump();
  expect(graph.derives).toHaveLength(1);
  // a and b were created in order: ids 1 and 2; the derive must depend on both.
  expect([...graph.derives[0].deps].sort()).toEqual([1, 2]);
});

test("wrapped states keep their semantics (recomputation)", async () => {
  const a = van.state(1);
  const d = van.derive(() => a.val * 2);
  expect(d.val).toBe(2);
  a.val = 5;
  // VanJS recomputes derives on the next microtask (updateDoms).
  await new Promise((r) => setTimeout(r, 0));
  expect(d.val).toBe(10);
});

test("R2: derive writing another state during its computation is detected", () => {
  const target = van.state(0);
  van.derive(() => {
    target.val = 1;
    return target.val;
  });
  expect(kinds()).toContain("derive-writes-state");
});

test("R2b: derive reading and writing the same state is flagged as a cycle", () => {
  const s = van.state(0);
  van.derive(() => {
    s.val = s.val + 1;
    return s.val;
  });
  expect(kinds()).toContain("derive-cycle");
});

test("R3: derive with no reads is detected", () => {
  van.derive(() => 42);
  expect(kinds()).toContain("derive-no-deps");
});

test("R4: trackRender over a function reading states reports a reactive container", () => {
  const c = van.state(1);
  debug.trackRender(() => {
    void c.val;
  });
  expect(kinds()).toContain("container-reactive-reads");
});

test("R4: renderIntentional suppresses the warning", () => {
  const c = van.state(1);
  const f = debug.renderIntentional(() => {
    void c.val;
  });
  debug.trackRender(f);
  expect(kinds()).not.toContain("container-reactive-reads");
});

test("silent accumulates without printing and configure restores it", () => {
  debug.configure({ silent: true });
  van.derive(() => 42);
  expect(kinds()).toContain("derive-no-deps");
  debug.configure({ silent: false });
});
