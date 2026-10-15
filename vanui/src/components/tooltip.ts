import van, { type ChildDom, type State } from "vanjs-core";
import { cx } from "../util.js";
import { readState } from "./checkable.js";
import { isCoarsePointer } from "./overlay.js";
import type { ToggleText } from "./checkbox.js";

export type TooltipPosition = "top" | "bottom" | "left" | "right";

export interface TooltipOptions {
  content: ToggleText;
  position?: TooltipPosition;
  /** Milisegundos antes de mostrar al hacer hover (default 300; el focus lo muestra al instante). */
  delay?: number;
  disabled?: boolean | State<boolean>;
  /** Clase extra para la burbuja (ancho, color, etc.). */
  class?: string;
  [key: string]: any;
}

/** Burbuja posicionada por CSS puro dentro de un wrapper relativo. */
const POSITION_CLASSES: Record<TooltipPosition, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

let nextId = 0;

/**
 * Tooltip accesible: aparece al hacer hover (con delay) y al recibir foco
 * por teclado (al instante). Desactivado en dispositivos táctiles.
 *
 * Limitación conocida: la burbuja se posiciona con CSS dentro del flujo,
 * así que un ancestro con `overflow: hidden` puede recortarla.
 */
export const Tooltip = (props: TooltipOptions, trigger: ChildDom): ChildDom => {
  const { span } = van.tags;
  const position = POSITION_CLASSES[props.position ?? "top"];
  const disabled = props.disabled;
  const visible = van.state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const id = `vanui-tooltip-${nextId++}`;
  const coarse = isCoarsePointer();

  const show = () => {
    if (readState(disabled, false)) return;
    visible.val = true;
  };
  const scheduleShow = () => {
    if (coarse || readState(disabled, false)) return;
    clearTimeout(timer);
    timer = setTimeout(show, props.delay ?? 300);
  };
  const hide = () => {
    clearTimeout(timer);
    visible.val = false;
  };

  return span(
    {
      class: "relative inline-flex",
      "aria-describedby": id,
      onmouseenter: scheduleShow,
      onmouseleave: hide,
      onfocusin: () => {
        if (!coarse) show();
      },
      onfocusout: hide,
    },
    trigger,
    // La burbuja siempre montada (ancla real): un hijo-función que devuelve
    // null moriría en el primer cambio (keepConnected descarta _dom null).
    span(
      {
        id,
        role: "tooltip",
        class: () =>
          cx(
            "pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs text-background shadow-lg",
            position,
            visible.val ? "" : "hidden",
            props.class,
          ),
      },
      props.content,
    ),
  );
};
