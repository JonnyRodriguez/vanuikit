import { beforeEach, test, expect } from "bun:test";
import { van } from "../src/index.js";
import { installVanDebug } from "../src/debug-graph.js";

const debug = installVanDebug(van);

beforeEach(() => {
  debug.clear();
});

function fakeForeignState(initVal: unknown) {
  const foreignProto = {
    get val() {
      return (this as { rawVal: unknown }).rawVal;
    },
    set val(v: unknown) {
      (this as { rawVal: unknown }).rawVal = v;
    },
  };
  return Object.assign(Object.create(foreignProto), {
    rawVal: initVal,
    _oldVal: initVal,
    _bindings: [],
    _listeners: [],
  });
}

const kinds = () => debug.diagnostics().map((d) => d.kind);

test("flags a foreign State passed as a tag child", () => {
  const foreign = fakeForeignState("x");
  const el = van.tags.div(foreign);
  expect(el).toBeDefined();
  expect(kinds()).toContain("foreign-state");
});

test("flags a foreign State inside a props bag", () => {
  const foreign = fakeForeignState("x");
  const el = van.tags.input({ value: foreign });
  expect(el).toBeDefined();
  expect(kinds()).toContain("foreign-state");
});

test("flags a foreign State passed to van.add", () => {
  const foreign = fakeForeignState("x");
  const host = document.createElement("div");
  document.body.append(host);
  van.add(host, foreign);
  expect(kinds()).toContain("foreign-state");
});

test("own states render without any foreign diagnostic", () => {
  const s = van.state("hi");
  const el = van.tags.div(s);
  expect(el.textContent).toBe("hi");
  expect(kinds()).not.toContain("foreign-state");
});
