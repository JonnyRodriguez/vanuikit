import van, { type ChildDom, type State } from "vanjs-core";

/**
 * Logs every change of the State (initial value included) and returns it for
 * chaining. Development tool: in production it is best to remove it
 * (or silence console in the build).
 *
 *   const count = trace(van.state(0), "count");
 *
 * Caution: like `t()`, each `trace` adds a permanent listener — do not
 * call it inside bindings that re-execute.
 */
export const trace = <T>(state: State<T>, name?: string): State<T> => {
  const label = name ?? "state";
  van.derive(() => {
    console.log(`[vanuikit:trace] ${label} =`, state.val);
  });
  return state;
};

export interface ExpectReactiveOptions {
  /** Builds the tree under test (mounted on a temporary host). */
  render: () => ChildDom;
  /** Mutates the states under test. */
  act: () => void;
  /** Exact text expected in the tree after `act()` (textContent). */
  text?: string;
  /** Substring expected after `act()`. */
  contains?: string;
  /** Custom wait (default: one microtask, van's binding cycle). */
  tick?: () => Promise<void>;
}

const VAN_BINDING_HINTS = `Pistas (gotchas de van):
  1. Un hijo-función que retorna null muere en el primer cambio (keepConnected
     descarta bindings con _dom null): usa un ancla siempre montada + hidden.
  2. Los árboles separados del documento pierden sus bindings: móntalo en body.
  3. t()/fmt./rawText creados DENTRO de un binding no re-suscriben: iza el
     State fuera de la función.`;

/**
 * Detector of frozen bindings for test suites (runner-agnostic: throws an
 * Error instead of using expect). Renders, captures the text, runs `act()`
 * and verifies that the tree mutated to the expected text.
 *
 *   await expectReactive({
 *     render: () => span(miState),
 *     act: () => (miState.val = "nuevo"),
 *     contains: "nuevo",
 *   });
 */
export const expectReactive = async (opts: ExpectReactiveOptions): Promise<void> => {
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  host.append(opts.render() as Node);

  opts.act();
  await (opts.tick?.() ?? new Promise<void>((r) => setTimeout(r, 0)));

  const after = host.textContent ?? "";
  host.remove();

  if (opts.text !== undefined && after !== opts.text) {
    throw new Error(
      `expectReactive: texto inesperado.\n  esperado: ${JSON.stringify(opts.text)}\n  recibido: ${JSON.stringify(after)}\n${VAN_BINDING_HINTS}`,
    );
  }
  if (opts.contains !== undefined && !after.includes(opts.contains)) {
    throw new Error(
      `expectReactive: el árbol no reaccionó (no contiene ${JSON.stringify(opts.contains)}; recibido: ${JSON.stringify(after)}).\n${VAN_BINDING_HINTS}`,
    );
  }
};
