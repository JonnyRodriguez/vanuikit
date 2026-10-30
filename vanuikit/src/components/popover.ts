import van, { type ChildDom, type State, type ValidChildDomValue } from "vanjs-core";
import { cx } from "../util.js";
import type { ToggleText } from "./checkbox.js";

export type PopoverPosition = "top" | "bottom" | "left" | "right";

export interface PopoverOptions {
  /** Elemento disparador (p. ej. un Button). El click alterna el panel. */
  trigger: ChildDom;
  position?: PopoverPosition;
  ariaLabel?: ToggleText;
  /**
   * Fábrica del contenido (se evalúa en cada apertura, como TabItem.content).
   * Recibe `close()` para que el propio panel pueda cerrarse.
   */
  content: (close: () => void) => ValidChildDomValue;
  /** Clase extra para el panel (ancho mínimo, padding, etc.). */
  panelClass?: string;
  class?: string;
  [key: string]: any;
}

const PANEL_POSITIONS: Record<PopoverPosition, string> = {
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

let nextId = 0;

/**
 * Panel flotante genérico anclado al trigger: se abre/cierra con click,
 * se cierra con Esc o click fuera, y devuelve el foco al trigger.
 * El contenido viaja como fábrica `content(close)` para reconstruirse
 * (y re-suscribirse) en cada apertura.
 *
 * Misma limitación que Tooltip: posicionamiento CSS, un ancestro con
 * `overflow: hidden` puede recortar el panel.
 */
export const Popover = (props: PopoverOptions): ChildDom => {
  const { div, span } = van.tags;
  const open = van.state(false);
  const id = `vanuikit-popover-${nextId++}`;

  const focusTrigger = () => {
    const focusable = containerEl?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.focus();
  };

  const onDocClick = (e: MouseEvent) => {
    if (containerEl && !containerEl.contains(e.target as Node)) setOpen(false);
  };
  const onDocKeydown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      focusTrigger();
    }
  };

  const setOpen = (v: boolean) => {
    if (open.val === v) return;
    open.val = v;
    if (typeof document === "undefined") return;
    if (v) {
      document.addEventListener("click", onDocClick);
      document.addEventListener("keydown", onDocKeydown);
    } else {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onDocKeydown);
    }
  };

  const containerEl = div(
    {
      id,
      class: () => cx("relative inline-block", props.class),
    },
    span(
      {
        "aria-haspopup": "dialog",
        "aria-expanded": () => (open.val ? "true" : "false"),
        onclick: () => setOpen(!open.val),
      },
      props.trigger,
    ),
    // Panel siempre montado (ancla real): un hijo-función que devuelve null
    // moriría en el primer cambio (keepConnected descarta _dom null). El
    // contenido sí se reconstruye en cada apertura vía la fábrica.
    div(
      // aria-label solo si fue provisto: undefined escribiría el atributo
      // literal "undefined" (props de van no aceptan undefined).
      {
        role: "dialog",
        "aria-modal": "false",
        ...(props.ariaLabel !== undefined ? { "aria-label": props.ariaLabel } : {}),
        class: () =>
          cx(
            "absolute z-50 min-w-[12rem] rounded-xl border border-border bg-background p-4 shadow-xl",
            PANEL_POSITIONS[props.position ?? "bottom"],
            open.val ? "" : "hidden",
            props.panelClass,
          ),
      },
      () => (open.val ? props.content(() => setOpen(false)) : div()),
    ),
  );
  return containerEl;
};
