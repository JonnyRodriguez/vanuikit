// vanuikit/src/components/await.ts
import van, { type ValidChildDomValue } from "vanjs-core";

export interface AwaitProps<T> {
  /**
   * Promise (or a factory returning one) to render. Resolved once on mount;
   * recreate the element to re-run.
   */
  promise: Promise<T> | (() => Promise<T>);
  /** Pending/first-render slot. Optional — renders empty by default. */
  loading?: () => ValidChildDomValue;
  /** Error slot; receives the rejection reason. */
  error?: (error: unknown) => ValidChildDomValue;
  /** Success slot; receives the resolved value. */
  success: (data: T) => ValidChildDomValue;
}

type Phase<T> =
  | { kind: "loading" }
  | { kind: "ok"; data: T }
  | { kind: "error"; error: unknown };

/**
 * Declarative rendering from any Promise: Pending/Error/success slots,
 * reactive to the promise outcome. Complements createQuery (fetch) for
 * loose promises. No user-facing text of its own — slots are consumer-owned.
 */
export function Await<T>(props: AwaitProps<T>): HTMLElement {
  const phase = van.state<Phase<T>>({ kind: "loading" });
  const empty = document.createTextNode("");

  const run = () => {
    const p = typeof props.promise === "function" ? props.promise() : props.promise;
    Promise.resolve(p).then(
      (data) => {
        phase.val = { kind: "ok", data };
      },
      (error) => {
        phase.val = { kind: "error", error };
      },
    );
  };
  run();

  return van.tags.div(() => {
    const current = phase.val;
    if (current.kind === "loading") return props.loading ? props.loading() : empty;
    if (current.kind === "error") return props.error ? props.error(current.error) : empty;
    return props.success(current.data);
  });
}
