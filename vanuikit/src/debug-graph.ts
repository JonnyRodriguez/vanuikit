/**
 * debug-graph.ts — VanJS instrumenter in development mode.
 *
 * Option-installs `van.state`/`van.derive` to build the real *dependency
 * tree* (which derive reads which states) and detect, at violation time,
 * the silent rules documented in AGENTS.md:
 *
 *  - R1 (state-in-derive):  `van.state()` created INSIDE a `van.derive`.
 *  - R2 (derive-writes-state): a derive writes states during its computation
 *    (feedback; if it also read them → cycle).
 *  - R3 (derive-no-deps):   a derive with no reads (not reactive).
 *  - R4 (container-reactive-reads): a render function reads reactive states
 *    (it will rebuild its subtree; only reported if it went through `trackRender`,
 *    and suppressed if the function was marked with `renderIntentional`).
 *
 * Usage (dev-only):
 *
 *   import { van, installVanDebug } from "vanuikit";
 *   const debug = installVanDebug(van);
 *   // ... start the app ...
 *   debug.printTree();   // graph in console
 *   debug.dump();        // serializable graph
 *
 * In production it is NOT imported nor called: the module has no effects on
 * import (it only defines functions) and the bundle removes it via tree-shaking.
 */

import type { State } from "vanjs-core";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type ViolationKind =
  | "state-in-derive"
  | "derive-writes-state"
  | "derive-cycle"
  | "derive-no-deps"
  | "container-reactive-reads";

export interface VanDebugDiagnostic {
  kind: ViolationKind;
  message: string;
  origin?: string;
}

export interface VanDebugNode {
  id: number;
  label: string;
}

export interface VanDebugDerive extends VanDebugNode {
  deps: number[]; // ids of the states it reads
  writes: number[]; // ids of the states it writes during computation
}

export interface VanDebugGraph {
  states: VanDebugNode[];
  derives: VanDebugDerive[];
  diagnostics: VanDebugDiagnostic[];
}

export interface VanDebugApi {
  /** Returns the current serializable graph. */
  dump(): VanDebugGraph;
  /** Prints the graph to console (derive → states tree). */
  printTree(): void;
  /** Accumulated diagnostics. */
  diagnostics(): readonly VanDebugDiagnostic[];
  /** Clears states, derives and diagnostics (for tests). */
  clear(): void;
  /**
   * Runs `fn` under a "render"-type frame (container function).
   * If `fn` reads reactive states, reports R4. Useful for verifying
   * suspicious containers during development.
   */
  trackRender<T>(fn: () => T, label?: string): T;
  /**
   * Marks a render function as intentionally reactive: if passed through
   * `trackRender`, state reads are NOT reported (rebuild on purpose).
   */
  renderIntentional<T extends (...args: never[]) => unknown>(fn: T): T;
  /** silence: true → does not print warnings (only accumulates). */
  configure(opts: { silent?: boolean }): void;
}

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

interface StateMeta {
  id: number;
  label: string;
  reads: number;
}

interface Frame {
  kind: "derive" | "render";
  label: string;
  deps: Set<StateMeta>;
  writes: Set<StateMeta>;
  parent: Frame | null;
  origin?: string;
}

const stateMeta = new WeakMap<object, StateMeta>();
const states = new Map<number, StateMeta>();
let stateSeq = 0;
const derives: VanDebugDerive[] = [];
const diagnostics: VanDebugDiagnostic[] = [];
let silent = false;
let activeFrame: Frame | null = null;
const intentionalRender = new WeakMap<object, true>();
const hookedStates = new WeakMap<object, true>();
let installedApi: VanDebugApi | undefined;

function metaOf(state: object): StateMeta {
  let m = stateMeta.get(state);
  if (!m) {
    m = { id: ++stateSeq, label: `state#${stateSeq}`, reads: 0 };
    stateMeta.set(state, m);
    states.set(m.id, m);
  }
  return m;
}

function captureCallSite(): string | undefined {
  const stack = new Error().stack?.split("\n") ?? [];
  for (const line of stack.slice(2)) {
    const t = line.trim();
    if (t.startsWith("at ")) return t;
  }
  return undefined;
}

function report(kind: ViolationKind, message: string, origin?: string): void {
  const d: VanDebugDiagnostic = { kind, message, origin: origin ?? captureCallSite() };
  diagnostics.push(d);
  if (!silent) {
    console.warn(`[vanuikit:debug] ${kind} — ${message}`);
    if (d.origin) console.warn(`  at ${d.origin}`);
  }
}

// ---------------------------------------------------------------------------
// State instrumentation
// ---------------------------------------------------------------------------

function findValDescriptor(obj: object): PropertyDescriptor | undefined {
  let cur: object | null = obj;
  while (cur) {
    const d = Object.getOwnPropertyDescriptor(cur, "val");
    if (d) return d;
    cur = Object.getPrototypeOf(cur);
  }
  return undefined;
}

function hookState(state: State<unknown>, label?: string): State<unknown> {
  if (hookedStates.has(state)) return state;
  hookedStates.set(state, true);

  const m = metaOf(state);
  if (label) m.label = label;

  const desc = findValDescriptor(state);
  // If the state does not expose `val` as an accessor, we cannot intercept it
  // without altering its semantics: leave it unhooked.
  if (!desc || (!desc.get && !desc.set)) return state;

  Object.defineProperty(state, "val", {
    configurable: true,
    enumerable: desc.enumerable ?? true,
    get(this: unknown) {
      if (activeFrame) activeFrame.deps.add(m);
      m.reads++;
      return desc.get ? desc.get.call(this) : undefined;
    },
    set(this: unknown, v: unknown) {
      if (activeFrame) activeFrame.writes.add(m);
      if (desc.set) desc.set.call(this, v);
    },
  });

  return state;
}

// ---------------------------------------------------------------------------
// Installation over a van instance
// ---------------------------------------------------------------------------

interface VanLike {
  state(initVal?: unknown, label?: string): State<unknown>;
  derive<T>(fn: () => T): State<T>;
}

let deriveSeq = 0;

function installVanDebug(van: VanLike): VanDebugApi {
  if (installedApi) return installedApi;
  let api!: VanDebugApi;

  const origState = van.state.bind(van);
  const origDerive = van.derive.bind(van);

  // R1: creating a state inside a frame (derive/render) violates the rule.
  van.state = ((initVal?: unknown, label?: string) => {
    if (activeFrame) {
      report(
        "state-in-derive",
        `van.state() created inside ${activeFrame.kind} "${activeFrame.label}" — the state is recreated on every recomputation and loses its identity. Hoist the state out of the function.`,
      );
    }
    return hookState(origState(initVal), label);
  }) as VanLike["state"];

  // The derive opens a frame: state reads inside fn() get registered as
  // dependencies of the derive (the dependency tree).
  van.derive = ((fn: () => unknown) => {
    const label = fn.name || `derive#${++deriveSeq}`;
    const frame: Frame = {
      kind: "derive",
      label,
      deps: new Set(),
      writes: new Set(),
      parent: activeFrame,
      origin: captureCallSite(),
    };

    const derived = origDerive(() => {
      const prev = activeFrame;
      activeFrame = frame;
      try {
        return fn();
      } finally {
        activeFrame = prev;
      }
    });

    // Forces the first evaluation to harvest the dependencies (in case van has
    // not computed the derive yet).
    void derived.val;

    if (frame.deps.size === 0) {
      report(
        "derive-no-deps",
        `derive "${label}" read no state — it is not reactive (did you use raw()/t().val, which registers no deps?).`,
        frame.origin,
      );
    }
    if (frame.writes.size > 0) {
      report(
        "derive-writes-state",
        `derive "${label}" writes states during its computation (${[...frame.writes].map((w) => w.label).join(", ")}) — dangerous reactive feedback.`,
        frame.origin,
      );
      for (const w of frame.writes) {
        if (frame.deps.has(w)) {
          report(
            "derive-cycle",
            `derive "${label}" reads and writes the same state "${w.label}" — reactivity cycle.`,
            frame.origin,
          );
        }
      }
    }

    const depIds = [...frame.deps].map((m) => m.id);
    const writeIds = [...frame.writes].map((m) => m.id);
    derives.push({ id: derives.length + 1, label, deps: depIds, writes: writeIds });

    return derived;
  }) as VanLike["derive"];

  api = {
    dump() {
      return {
        states: [...states.values()].map((m) => ({ id: m.id, label: m.label })),
        derives: derives.map((d) => ({ ...d, deps: [...d.deps], writes: [...d.writes] })),
        diagnostics: diagnostics.map((d) => ({ ...d })),
      };
    },
    printTree() {
      const byId = new Map(states.entries());
      console.group("[vanuikit:debug] dependency tree");
      for (const d of derives) {
        const deps = d.deps.length
          ? d.deps.map((id) => byId.get(id)?.label ?? `#${id}`).join(", ")
          : "(no deps)";
        const writes = d.writes.length
          ? ` [writes: ${d.writes.map((id) => byId.get(id)?.label ?? `#${id}`).join(", ")}]`
          : "";
        console.log(`derive ${d.label} → ${deps}${writes}`);
      }
      console.groupEnd();
    },
    diagnostics() {
      return diagnostics;
    },
    clear() {
      states.clear();
      derives.length = 0;
      diagnostics.length = 0;
      stateSeq = 0;
      deriveSeq = 0;
    },
    trackRender<T>(fn: () => T, label?: string): T {
      if (intentionalRender.has(fn)) return fn();
      const frame: Frame = {
        kind: "render",
        label: label ?? fn.name ?? "render",
        deps: new Set(),
        writes: new Set(),
        parent: activeFrame,
        origin: captureCallSite(),
      };
      const prev = activeFrame;
      activeFrame = frame;
      let out: T;
      try {
        out = fn();
      } finally {
        activeFrame = prev;
      }
      if (frame.deps.size > 0) {
        report(
          "container-reactive-reads",
          `render function "${frame.label}" read reactive states (${[...frame.deps].map((m) => m.label).join(", ")}) — it will rebuild its subtree when those states change. If intentional, wrap the function with renderIntentional().`,
          frame.origin,
        );
      }
      return out;
    },
    renderIntentional<T extends (...args: never[]) => unknown>(fn: T): T {
      intentionalRender.set(fn, true);
      return fn;
    },
    configure(opts: { silent?: boolean }) {
      if (opts.silent !== undefined) silent = opts.silent;
    },
  };

  installedApi = api;
  return api;
}

export { installVanDebug };
