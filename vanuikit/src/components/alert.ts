import van, { type ChildDom, type State } from "vanjs-core";
import { t } from "../i18n.js";
import { cx } from "../util.js";
import type { ToggleText } from "./checkbox.js";
import { Icon, type IconName } from "./icon.js";

export type AlertVariant = "info" | "success" | "warning" | "error";

export interface AlertOptions {
  variant?: AlertVariant;
  title?: ToggleText;
  showIcon?: boolean;
  /** Ícono personalizado (default: Icon según variante). */
  icon?: ChildDom;
  /** Muestra el botón de cierre; al cerrar, el aviso queda oculto. */
  dismissible?: boolean;
  onDismiss?: () => void;
  class?: string;
  children?: any;
  [key: string]: any;
}

/** Paleta por variante (tokens del tema, mismo esquema que Badge):
 *  caja con tinte al 10% y borde al 20%; ícono con el -fg del estado. */
const VARIANT_STYLES: Record<AlertVariant, { box: string; fg: string; icon: IconName }> = {
  info: { box: "bg-info/10 border-info/20", fg: "text-info-fg", icon: "info" },
  success: { box: "bg-success/10 border-success/20", fg: "text-success-fg", icon: "check-circle" },
  warning: { box: "bg-warning/10 border-warning/20", fg: "text-warning-fg", icon: "alert-triangle" },
  error: { box: "bg-destructive/10 border-destructive/20", fg: "text-destructive-fg", icon: "x-circle" },
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
      ? props.icon ?? Icon({ name: styles.icon, class: cx("size-4 mt-0.5", styles.fg) })
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
          Icon({ name: "x", class: "size-3.5" }),
        )
      : null,
  );
};
