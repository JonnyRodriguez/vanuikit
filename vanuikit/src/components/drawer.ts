import van, { type ChildDom, type State } from "vanjs-core";
import { t } from "../i18n.js";
import { cx } from "../util.js";
import { useScrollLock } from "./overlay.js";

export type DrawerSide = "left" | "right" | "top" | "bottom";

export interface DrawerOptions {
  /** Consumer-controlled state: true = open. */
  open: State<boolean>;
  side?: DrawerSide;
  /** Esc and backdrop click close it (default true). */
  dismissible?: boolean;
  onClose?: () => void;
  /** × button in the corner (default true; uses the modal.close key). */
  showClose?: boolean;
  /** Extra panel classes (e.g. w-96 to widen it). */
  class?: string;
  [key: string]: any;
}

const SIDE_PANEL: Record<DrawerSide, { base: string; open: string; closed: string }> = {
  left: { base: "inset-y-0 left-0 w-80 max-w-[85vw]", open: "translate-x-0", closed: "-translate-x-full" },
  right: { base: "inset-y-0 right-0 w-80 max-w-[85vw]", open: "translate-x-0", closed: "translate-x-full" },
  top: { base: "inset-x-0 top-0 h-80 max-h-[85vh]", open: "translate-y-0", closed: "-translate-y-full" },
  bottom: { base: "inset-x-0 bottom-0 h-80 max-h-[85vh]", open: "translate-y-0", closed: "translate-y-full" },
};

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/**
 * Sliding panel per side (generalizes the responsive sidebar pattern):
 * backdrop with transition, Esc, body scroll lock, focus moving into
 * the panel (with a Tab trap) and back to the element that opened it. The panel
 * stays mounted (translated off-screen) to preserve bindings.
 */
export const Drawer = (props: DrawerOptions, ...content: ChildDom[]): ChildDom => {
  const { div, button } = van.tags;
  const side = SIDE_PANEL[props.side ?? "right"];
  const dismissible = props.dismissible !== false;
  const showClose = props.showClose !== false;

  let panelEl: HTMLElement | null = null;
  let lastFocused: HTMLElement | null = null;

  const close = () => {
    props.open.val = false;
    props.onClose?.();
  };

  const onKeydown = (e: KeyboardEvent) => {
    if (!props.open.val) return;
    if (e.key === "Escape") {
      if (dismissible) {
        e.preventDefault();
        close();
      }
    } else if (e.key === "Tab" && panelEl) {
      // Focus trap: Tab cannot leave the panel while it is open.
      const focusables = panelEl.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!focusables.length) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (!panelEl.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  // Document listeners, focus management and scroll lock, tied to the
  // `open` state (the derive lives with the component tree).
  van.derive(() => {
    if (typeof document === "undefined") return;
    if (props.open.val) {
      lastFocused = document.activeElement as HTMLElement | null;
      document.addEventListener("keydown", onKeydown);
      // When created with open=true the panel does not exist yet: defer focus.
      panelEl ? panelEl.focus() : setTimeout(() => panelEl?.focus(), 0);
    } else {
      document.removeEventListener("keydown", onKeydown);
      if (lastFocused) {
        lastFocused.focus?.();
        lastFocused = null;
      }
    }
  });
  useScrollLock(props.open);

  const backdrop = div({
    class: () =>
      cx(
        "absolute inset-0 bg-overlay transition-opacity duration-300",
        props.open.val ? "opacity-100" : "opacity-0",
      ),
    onclick: () => dismissible && close(),
  });

  const panel = div(
    {
      tabindex: "-1",
      role: "dialog",
      "aria-modal": "true",
      class: () =>
        cx(
          "absolute flex flex-col overflow-y-auto bg-background shadow-2xl outline-none transition-transform duration-300",
          side.base,
          props.open.val ? side.open : side.closed,
          props.class,
        ),
    },
    showClose
      ? button(
          {
            type: "button",
            class:
              "absolute top-3 right-3 z-10 cursor-pointer rounded p-1 text-xl leading-none text-muted transition-colors hover:text-foreground-soft",
            "aria-label": t("modal.close", "Close"),
            onclick: close,
          },
          "×",
        )
      : null,
    ...content,
  );

  const overlay = div(
    {
      class: () =>
        cx("fixed inset-0 z-50", props.open.val ? "" : "pointer-events-none"),
      "aria-hidden": () => (props.open.val ? "false" : "true"),
    },
    backdrop,
    panel,
  );

  panelEl = panel;
  return overlay;
};
