import van, { type ChildDom, type State } from "vanjs-core";
import { cx } from "../util.js";
import { readState } from "./checkable.js";
import { isCoarsePointer } from "./overlay.js";
import type { ToggleText } from "./checkbox.js";

export type TooltipPosition = "top" | "bottom" | "left" | "right";

export interface TooltipOptions {
  content: ToggleText;
  position?: TooltipPosition;
  /** Milliseconds before showing on hover (default 300; focus shows it instantly). */
  delay?: number;
  disabled?: boolean | State<boolean>;
  /** Extra class for the bubble (width, color, etc.). */
  class?: string;
  [key: string]: any;
}

/** Bubble positioned with pure CSS inside a relative wrapper. */
const POSITION_CLASSES: Record<TooltipPosition, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

let nextId = 0;

/**
 * Accessible tooltip: appears on hover (with delay) and on keyboard focus
 * (instantly). Disabled on touch devices.
 *
 * Known limitation: the bubble is positioned with CSS inside the flow,
 * so an ancestor with `overflow: hidden` may clip it.
 */
export const Tooltip = (props: TooltipOptions, trigger: ChildDom): ChildDom => {
  const { span } = van.tags;
  const position = POSITION_CLASSES[props.position ?? "top"];
  const disabled = props.disabled;
  const visible = van.state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const id = `vanuikit-tooltip-${nextId++}`;
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
    // The bubble is always mounted (real anchor): a function-child returning
    // null would die on the first toggle (keepConnected discards _dom null).
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
