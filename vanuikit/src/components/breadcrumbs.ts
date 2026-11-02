import van, { type ChildDom } from "vanjs-core";
import { Link } from "./nav.js";
import { t } from "../i18n.js";
import { cx } from "../util.js";
import type { ToggleText } from "./checkbox.js";

export interface BreadcrumbItem {
  label: ToggleText;
  /** If omitted, the item renders as plain text (typical for the last one). */
  href?: string;
  icon?: ChildDom;
}

export interface BreadcrumbsOptions {
  items: BreadcrumbItem[];
  /** Separator between items (default "/"). Decorative: aria-hidden. */
  separator?: string;
  ariaLabel?: ToggleText;
  class?: string;
  [key: string]: any;
}

/**
 * Navigation trail (`<nav>` + list): items with `href` use `Link`
 * (SPA navigation with Ctrl/Cmd+click, `target` and external links) and
 * the last one carries `aria-current="page"`.
 */
export const Breadcrumbs = (props: BreadcrumbsOptions): ChildDom => {
  const { nav, ol, li, span } = van.tags;
  const ariaLabel = props.ariaLabel ?? t("breadcrumbs.ariaLabel", "Breadcrumb");

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
              ? Link({ href: item.href, variant: "muted", class: "transition-colors" }, item.label)
              : isLast
                ? span({ "aria-current": "page" }, item.label)
                : span(item.label),
          ),
        ];
      }),
    ),
  );
};
