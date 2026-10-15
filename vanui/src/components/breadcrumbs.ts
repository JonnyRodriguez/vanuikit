import van, { type ChildDom } from "vanjs-core";
import { t } from "../i18n.js";
import { cx } from "../util.js";
import type { ToggleText } from "./checkbox.js";

export interface BreadcrumbItem {
  label: ToggleText;
  /** Si se omite, el ítem se renderiza como texto (típico en el último). */
  href?: string;
  icon?: ChildDom;
}

export interface BreadcrumbsOptions {
  items: BreadcrumbItem[];
  /** Separador entre ítems (default "/"). Decorativo: aria-hidden. */
  separator?: string;
  ariaLabel?: ToggleText;
  class?: string;
  [key: string]: any;
}

/**
 * Ruta de navegación (`<nav>` + lista): los ítems con `href` son anchors
 * normales — el click handler global del Router los navega sin recarga — y
 * el último lleva `aria-current="page"`.
 */
export const Breadcrumbs = (props: BreadcrumbsOptions): ChildDom => {
  const { nav, ol, li, a, span } = van.tags;
  const ariaLabel = props.ariaLabel ?? t("breadcrumbs.ariaLabel", "Ruta de navegación");

  return nav(
    { "aria-label": ariaLabel, class: () => cx("breadcrumbs", props.class) },
    ol(
      { class: "flex flex-wrap items-center gap-1.5 list-none m-0 p-0 text-sm" },
      ...props.items.map((item, i) => {
        const isLast = i === props.items.length - 1;
        return [
          i > 0
            ? li({ class: "text-muted-foreground select-none", "aria-hidden": "true" }, props.separator ?? "/")
            : null,
          li(
            {
              class: () =>
                cx(
                  "flex items-center gap-1.5",
                  isLast ? "font-semibold text-foreground" : "text-foreground-soft",
                ),
            },
            item.icon,
            item.href && !isLast
              ? a(
                  { href: item.href, class: "hover:text-foreground transition-colors" },
                  item.label,
                )
              : isLast
                ? span({ "aria-current": "page" }, item.label)
                : span(item.label),
          ),
        ];
      }),
    ),
  );
};
