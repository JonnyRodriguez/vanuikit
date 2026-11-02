import van, { type State } from "vanjs-core";

let lockCount = 0;

/**
 * Locks body scroll while `open` is true. Uses a counter for stacked
 * overlays: the lock is released only when the last overlay closes.
 * The derive lives as long as the component tree does.
 */
export const useScrollLock = (open: State<boolean>) => {
  van.derive(() => {
    if (typeof document === "undefined") return;
    if (open.val) {
      lockCount++;
      if (lockCount === 1) document.body.style.overflow = "hidden";
    } else {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) document.body.style.overflow = "";
    }
  });
};

/** Detects devices without hover (touch): tooltips do not open there. */
export const isCoarsePointer = (): boolean => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(hover: none)").matches;
};
