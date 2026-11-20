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

const VAN_BINDING_HINTS = `Hints (van gotchas):
  1. A function-child returning null dies on the first change (keepConnected
     discards bindings with a null _dom): use an always-mounted anchor + hidden.
  2. Trees detached from the document lose their bindings: mount it on body.
  3. t()/fmt./rawText created INSIDE a binding do not re-subscribe: hoist the
     State out of the function.`;

/**
 * Detector of frozen bindings for test suites (runner-agnostic: throws an
 * Error instead of using expect). Renders, captures the text, runs `act()`
 * and verifies that the tree mutated to the expected text.
 *
 *   await expectReactive({
 *     render: () => span(myState),
 *     act: () => (myState.val = "new"),
 *     contains: "new",
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
      `expectReactive: unexpected text.\n  expected: ${JSON.stringify(opts.text)}\n  received: ${JSON.stringify(after)}\n${VAN_BINDING_HINTS}`,
    );
  }
  if (opts.contains !== undefined && !after.includes(opts.contains)) {
    throw new Error(
      `expectReactive: the tree did not react (does not contain ${JSON.stringify(opts.contains)}; received: ${JSON.stringify(after)}).\n${VAN_BINDING_HINTS}`,
    );
  }
};
