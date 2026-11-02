import van, { type State } from "vanjs-core";
import { cx } from "../util.js";
import { asState } from "./checkable.js";
import type { ToggleText } from "./checkbox.js";

export type ProgressSize = "sm" | "md" | "lg";

export interface ProgressOptions {
  /** Percentage 0–100 (clamped); accepts a State for a reactive bar. */
  value?: number | State<number>;
  /** Indeterminate progress bar (pulse); ignores `value`. */
  indeterminate?: boolean | State<boolean>;
  label?: ToggleText;
  /** Shows the percentage next to the label (default true; hidden if indeterminate). */
  showValue?: boolean;
  size?: ProgressSize;
  /** Fill class to color it (default bg-accent). */
  fillClass?: string;
  class?: string;
  [key: string]: any;
}

const TRACK_SIZES: Record<ProgressSize, string> = { sm: "h-1.5", md: "h-2.5", lg: "h-4" };

/**
 * Accessible progress bar (`role="progressbar"` + aria-valuenow).
 * Determinate with `value` (accepts a State to update live) or
 * indeterminate with `indeterminate`.
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
