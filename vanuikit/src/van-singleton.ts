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
