import van, { type State } from "vanjs-core";

let lockCount = 0;

/**
 * Bloquea el scroll del body mientras `open` esté en true. Con contador para
 * overlays apilados: solo se libera cuando el último overlay cierra.
 * El derive vive mientras viva el árbol del componente.
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

/** Detecta dispositivos sin hover (touch): los tooltips no se abren ahí. */
export const isCoarsePointer = (): boolean => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(hover: none)").matches;
};
