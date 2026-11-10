import van, { type ChildDom, type State, type ValidChildDomValue } from "vanjs-core";
import { cx } from "../util.js";
import type { ToggleText } from "./checkbox.js";

export type PopoverPosition = "top" | "bottom" | "left" | "right";

export interface PopoverOptions {
  /** Trigger element (e.g. a Button). Click toggles the panel. */
  trigger: ChildDom;
  position?: PopoverPosition;
  ariaLabel?: ToggleText;
  /**
   * Content factory (evaluated on each open, like TabItem.content).
   * Receives `close()` so the panel can close itself.
   */
  content: (close: () => void) => ValidChildDomValue;
  /** Extra class for the panel (min width, padding, etc.). */
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
 * Generic floating panel anchored to the trigger: opens/closes with click,
 * closes with Esc or click outside, and returns focus to the trigger.
 * Content is passed as a `content(close)` factory so it is rebuilt
 * (and re-subscribed) on each open.
 *
 * Same limitation as Tooltip: CSS positioning, an ancestor with
 * `overflow: hidden` may clip the panel.
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
    triggerEl?.setAttribute?.("aria-expanded", v ? "true" : "false");
    if (typeof document === "undefined") return;
    if (v) {
      document.addEventListener("click", onDocClick);
      document.addEventListener("keydown", onDocKeydown);
    } else {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onDocKeydown);
    }
  };

  // El trigger es el control interactivo real: lleva `aria-expanded` y el
  // toggle. Un span sin rol no puede portar `aria-expanded` (viola
  // aria-allowed-attr), así que el estado se comunica sobre el propio botón.
  const triggerEl = (typeof props.trigger === "function" ? null : props.trigger) as
    | HTMLElement
    | null;
  triggerEl?.setAttribute?.("aria-expanded", "false");
  triggerEl?.addEventListener?.("click", (e) => {
    e.stopPropagation();
    setOpen(!open.val);
  });

  const containerEl = div(
    {
      id,
      class: () => cx("relative inline-block", props.class),
    },
    props.trigger,
    // Panel always mounted (real anchor): a function-child returning null
    // would die on the first toggle (keepConnected discards _dom null). The
    // content is indeed rebuilt on each open via the factory.
    div(
      // aria-label only if provided: undefined would write the literal
      // "undefined" attribute (van props do not accept undefined).
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
