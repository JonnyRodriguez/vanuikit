import van, { type ChildDom, type State } from "vanjs-core";
import { t } from "../i18n.js";
import { cx } from "../util.js";
import type { ToggleText } from "./checkbox.js";

export type AlertVariant = "info" | "success" | "warning" | "error";

export interface AlertOptions {
  variant?: AlertVariant;
  title?: ToggleText;
  showIcon?: boolean;
  /** Ícono personalizado (default: emoji según variante). */
  icon?: ChildDom;
  /** Muestra el botón de cierre; al cerrar, el aviso queda oculto. */
  dismissible?: boolean;
  onDismiss?: () => void;
  class?: string;
  children?: any;
  [key: string]: any;
}

/** Paleta por variante (mismo esquema que Badge). */
const VARIANT_STYLES: Record<AlertVariant, { box: string; icon: string }> = {
  info: { box: "bg-blue-500/10 border-blue-500/20", icon: "ℹ️" },
  success: { box: "bg-emerald-500/10 border-emerald-500/20", icon: "✅" },
  warning: { box: "bg-amber-500/10 border-amber-500/20", icon: "⚠️" },
  error: { box: "bg-rose-500/10 border-rose-500/20", icon: "❌" },
};

/**
 * Aviso estático (a diferencia de `toast`, que es transitorio): errores de
 * formulario persistentes, banners de estado, confirmaciones inline.
 * Uso: Alert({ variant: "error", title }, "Mensaje del aviso").
 */
export const Alert = (props: AlertOptions = {}, ...children: ChildDom[]) => {
  const { div, p, span, button } = van.tags;
  const styles = VARIANT_STYLES[props.variant ?? "info"];
  const visible = van.state(true);
  const dismissLabel: State<string> = t("alert.dismiss", "Cerrar aviso");

  return div(
    {
      role: "alert",
      class: () =>
        cx(
          "alert flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
          styles.box,
          visible.val ? "" : "hidden",
          props.class,
        ),
    },
    props.showIcon !== false
      ? span({ class: "shrink-0 leading-5", "aria-hidden": "true" }, props.icon ?? styles.icon)
      : null,
    div(
      { class: "flex-1 space-y-0.5" },
      props.title !== undefined
        ? p({ class: "font-semibold text-foreground" }, props.title)
        : null,
      children.length ? div({ class: "text-foreground-soft" }, ...children) : null,
    ),
    props.dismissible
      ? button(
          {
            class:
              "shrink-0 cursor-pointer rounded p-1 leading-none text-foreground-soft transition-colors hover:text-foreground",
            "aria-label": dismissLabel,
            onclick: () => {
              visible.val = false;
              props.onDismiss?.();
            },
          },
          "✕",
        )
      : null,
  );
};
