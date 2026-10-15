import van, { type ChildDom } from "vanjs-core";
import { cx } from "../util.js";
import type { ToggleText } from "./checkbox.js";

export interface EmptyStateOptions {
  /** Ícono decorativo (emoji o ChildDom); default "📭". */
  icon?: ChildDom;
  title: ToggleText;
  description?: ToggleText;
  /** Slot de acción (p. ej. un Button que abre el flujo de creación). */
  action?: ChildDom;
  class?: string;
  [key: string]: any;
}

/**
 * Estado vacío de una vista o sección: ícono, título, descripción y acción
 * principal. El texto siempre lo aporta el consumidor con `t()`; el
 * componente solo aporta la maquetación.
 */
export const EmptyState = (props: EmptyStateOptions) => {
  const { div, p } = van.tags;
  return div(
    {
      class: cx(
        "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-6 py-10 text-center",
        props.class,
      ),
    },
    div({ class: "text-3xl", "aria-hidden": "true" }, props.icon ?? "📭"),
    p({ class: "text-sm font-semibold text-foreground" }, props.title),
    props.description
      ? p({ class: "max-w-sm text-xs text-foreground-soft" }, props.description)
      : null,
    props.action ? div({ class: "pt-2" }, props.action) : null,
  );
};
