import { describe, test, expect, afterEach } from "bun:test";
import {
  van,
  isOwnState,
  isForeignState,
  warnForeignState,
} from "../src/index.js";
import { guardSingleVan } from "../src/van-singleton.js";

// Builds a state-shaped object with a DIFFERENT prototype than our copy's
// states — mimics a State coming from a second copy of vanjs-core.
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

const origWarn = console.warn;
const origError = console.error;
const warns: string[][] = [];
const errors: string[][] = [];

afterEach(() => {
  console.warn = origWarn;
  console.error = origError;
  warns.length = 0;
  errors.length = 0;
});

function capture() {
  console.warn = (...a: string[]) => warns.push(a);
  console.error = (...a: string[]) => errors.push(a);
}

describe("guardSingleVan", () => {
  test("warns when a second, distinct instance registers", () => {
    capture();
    const other = { state: () => ({}) };
    guardSingleVan(other);
    expect(warns.length).toBe(0);
    expect(errors.length).toBe(1);
    expect(errors[0].join(" ")).toContain("TWO copies of vanjs-core");
  });

  test("does not warn when the canonical instance registers again", () => {
    capture();
    guardSingleVan(van);
    expect(errors.length).toBe(0);
    expect(warns.length).toBe(0);
  });
});

describe("isOwnState / isForeignState", () => {
  test("our own states are owned, never foreign", () => {
    const s = van.state("hi");
    expect(isOwnState(s)).toBe(true);
    expect(isForeignState(s)).toBe(false);
  });

  test("a state-shaped object with another prototype is foreign", () => {
    const foreign = fakeForeignState("hi");
    expect(isOwnState(foreign)).toBe(false);
    expect(isForeignState(foreign)).toBe(true);
  });

  test("plain values and DOM-ish objects are never foreign", () => {
    expect(isForeignState({})).toBe(false);
    expect(isForeignState(null)).toBe(false);
    expect(isForeignState(42)).toBe(false);
    expect(isForeignState("x")).toBe(false);
    expect(isForeignState(() => undefined)).toBe(false);
  });
});

describe("warnForeignState", () => {
  test("warns once per foreign state with a targeted message", () => {
    capture();
    const foreign = fakeForeignState(1);
    warnForeignState(foreign, "as props");
    warnForeignState(foreign, "as props"); // deduped
    expect(warns.length).toBe(1);
    expect(warns[0].join(" ")).toContain("copy of vanjs-core");
    expect(warns[0].join(" ")).toContain("as props");
  });

  test("silent for own states and non-states", () => {
    capture();
    warnForeignState(van.state(1), "as child");
    warnForeignState({}, "as child");
    expect(warns.length).toBe(0);
  });
});
