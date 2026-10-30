import van, { type State } from "vanjs-core";
import { cx } from "../util.js";
import { asState } from "./checkable.js";
import type { ToggleText } from "./checkbox.js";

export type ProgressSize = "sm" | "md" | "lg";

export interface ProgressOptions {
  /** Porcentaje 0–100 (se acota); acepta State para barra reactiva. */
  value?: number | State<number>;
  /** Barra de progreso indeterminada (pulso); ignora `value`. */
  indeterminate?: boolean | State<boolean>;
  label?: ToggleText;
  /** Muestra el porcentaje junto al label (default true; oculto si indeterminada). */
  showValue?: boolean;
  size?: ProgressSize;
  /** Clase del fill para colorearlo (default bg-accent). */
  fillClass?: string;
  class?: string;
  [key: string]: any;
}

const TRACK_SIZES: Record<ProgressSize, string> = { sm: "h-1.5", md: "h-2.5", lg: "h-4" };

/**
 * Barra de progreso accesible (`role="progressbar"` + aria-valuenow).
 * Determinada con `value` (acepta State para actualizarse en vivo) o
 * indeterminada con `indeterminate`.
 */
export const Progress = (props: ProgressOptions = {}) => {
  const { div, span } = van.tags;
  const value = asState(props.value, 0);
  const indeterminate = asState(props.indeterminate, false);
  const size = TRACK_SIZES[props.size ?? "md"];
  const pct = van.derive(() => Math.min(100, Math.max(0, Math.round(value.val))));

  const trackAttrs: Record<string, any> = {
    role: "progressbar",
    "aria-valuemin": "0",
    "aria-valuemax": "100",
    "aria-valuenow": () => String(pct.val),
    class: () => cx("w-full overflow-hidden rounded-full bg-border", size),
  };
  if (props.label !== undefined) trackAttrs["aria-label"] = props.label;

  return div(
    { class: () => cx("progress flex flex-col gap-1", props.class) },
    props.label !== undefined || props.showValue !== false
      ? div(
          { class: "flex items-center justify-between text-xs text-foreground-soft" },
          props.label !== undefined ? span(props.label) : span(),
          props.showValue === false
            ? null
            : span(
                { class: () => cx("progress-value", indeterminate.val ? "hidden" : "") },
                () => `${pct.val}%`,
              ),
        )
      : null,
    div(
      trackAttrs,
      span({
        class: () =>
          cx(
            "block h-full rounded-full transition-all duration-300",
            props.fillClass ?? "bg-accent",
            indeterminate.val ? "w-1/3 animate-pulse" : "",
          ),
        style: () => (indeterminate.val ? "" : `width: ${pct.val}%`),
      }),
    ),
  );
};
