/**
 * Runtime detector of the VanJS single-instance rule.
 *
 * Two copies of vanjs-core in the same bundle are two state systems that
 * do not talk to each other: reactivity silently breaks (the router view
 * does not change on navigation, frozen bindings, components going empty).
 * Documentation is not enough — this guard turns the error into an
 * immediate console message with the exact fix.
 *
 * `Symbol.for` (not `Symbol`): ALL copies of the module share the global
 * registry, even if each one lives in a different file of the bundle —
 * that is how the second copy gives itself away on evaluation.
 */
const INSTANCE_KEY = Symbol.for("vanuikit.vanjs-core.instance");

/** Registers the van instance and warns (console.error) if another one already existed. */
export function guardSingleVan(van: unknown): void {
  const g = globalThis as unknown as Record<symbol, unknown>;
  const prev = g[INSTANCE_KEY];
  if (prev !== undefined && prev !== van) {
    // Does not overwrite the mark: the real copy stays registered.
    // Message in English: console message for npm package consumers.
    console.error(
      [
        "[vanuikit] TWO copies of vanjs-core detected in this bundle: reactivity silently breaks.",
        "  Symptoms: views don't update on navigation, frozen text, components going empty or duplicated.",
        '  1) Always import van from "vanuikit" (import { van } from "vanuikit"); never import "vanjs-core" directly.',
        "  2) Keep a single physical copy: align vanjs-core versions across your tree and dedupe it in your bundler.",
      ].join("\n"),
    );
    return;
  }
  g[INSTANCE_KEY] = van;
}

// ---------------------------------------------------------------------------
// State provenance
// ---------------------------------------------------------------------------
//
// Instead of relying on a second copy registering itself (which a direct
// `import van from "vanjs-core"` in a consumer never does), we detect foreign
// states by prototype identity: every state created by a given copy of
// vanjs-core shares that copy's module-local `stateProto`. A state that flows
// into vanuikit (as a prop or a child) and is NOT backed by our own
// `stateProto` comes from another copy — the silent "two copies" failure.

let ownStateProto: object | null = null;
let warnedForeign = new WeakSet<object>();

/** Captures the prototype of the states created by the given van instance. */
export function captureOwnStateProto(van: { state?: (init?: unknown) => unknown }): void {
  if (!ownStateProto && van?.state) {
    ownStateProto = Object.getPrototypeOf(van.state()) as object;
  }
}

/** True if `x` is a state created by this van instance (our copy). */
export function isOwnState(x: unknown): boolean {
  return (
    ownStateProto !== null &&
    !!x &&
    typeof x === "object" &&
    Object.getPrototypeOf(x) === ownStateProto
  );
}

/**
 * True if `x` has the shape of a vanjs-core state but is NOT backed by our own
 * `stateProto` — i.e. it comes from another copy of vanjs-core.
 * Uses the plain-data marker `_bindings` (an array present on every state), so
 * it never triggers accessors and never flags plain objects or DOM nodes.
 */
export function isForeignState(x: unknown): boolean {
  return (
    !!x &&
    typeof x === "object" &&
    Array.isArray((x as { _bindings?: unknown })._bindings) &&
    !isOwnState(x)
  );
}

/**
 * Emits a single, targeted console warning (per state) when a foreign state is
 * found flowing into vanuikit. `hint` prefixes the message to say where.
 */
export function warnForeignState(x: unknown, hint?: string): void {
  if (!isForeignState(x)) return;
  if (warnedForeign.has(x as object)) return;
  warnedForeign.add(x as object);
  const where = hint ? ` in ${hint}` : "";
  console.warn(
    [
      `[vanuikit] A State created by ANOTHER copy of vanjs-core was passed to vanuikit${where}: reactivity silently breaks (frozen bindings, empty components).`,
      '  Fix: import van from "vanuikit" (import { van } from "vanuikit"); never import "vanjs-core" directly. Align versions and dedupe.',
    ].join("\n"),
  );
}
