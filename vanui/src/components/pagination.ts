import van, { type ChildDom, type State } from "vanjs-core";
import { t } from "../i18n.js";
import { cx } from "../util.js";
import { asState } from "./checkable.js";
import type { ToggleText } from "./checkbox.js";

export interface PaginationOptions {
  /** Página actual (1-based); acepta State externo para enlace bidireccional. */
  page: number | State<number>;
  /** Total de páginas; admite State (listas que crecen/encogen). */
  totalPages: number | State<number>;
  /** Páginas vecinas visibles alrededor de la actual (default 1). */
  siblingCount?: number;
  ariaLabel?: ToggleText;
  class?: string;
  [key: string]: any;
}

type Slot = number | "ellipsis-l" | "ellipsis-r";

/**
 * Rango de páginas con ellipsis: 1 y última siempre visibles, `siblingCount`
 * vecinas alrededor de la actual y "…" donde se recorta.
 */
export const pageSlots = (page: number, totalPages: number, siblingCount: number): Slot[] => {
  const total = Math.max(1, totalPages);
  const current = Math.min(Math.max(1, page), total);
  if (total <= siblingCount * 2 + 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const midStart = Math.max(2, current - siblingCount);
  const midEnd = Math.min(total - 1, current + siblingCount);
  const slots: Slot[] = [1];
  if (midStart > 2) slots.push("ellipsis-l");
  for (let i = midStart; i <= midEnd; i++) slots.push(i);
  if (midEnd < total - 1) slots.push("ellipsis-r");
  slots.push(total);
  return slots;
};

/**
 * Paginación numerada standalone (la del DataGrid es la versión simple
 * prev/"x / y"/next): `<nav>` con botones, `aria-current="page"` en la
 * actual, prev/next deshabilitados en los extremos y `page` bidireccional.
 */
export const Pagination = (props: PaginationOptions): ChildDom => {
  const { nav, button, span } = van.tags;
  const page = asState(props.page, 1);
  const totalPages = asState(props.totalPages, 1);
  const siblingCount = props.siblingCount ?? 1;
  const ariaLabel = props.ariaLabel ?? t("pagination.ariaLabel", "Paginación");

  const go = (p: number) => {
    page.val = Math.min(Math.max(1, p), totalPages.val);
  };

  const baseBtn =
    "flex h-8 min-w-8 items-center justify-center rounded-md border border-border bg-background px-2 text-sm text-foreground transition-colors cursor-pointer hover:bg-secondary/20 disabled:opacity-40 disabled:pointer-events-none select-none";

  return nav(
    { "aria-label": ariaLabel, class: () => cx("pagination flex items-center gap-1.5", props.class) },
    button(
      {
        type: "button",
        "aria-label": t("pagination.previous", "Anterior"),
        disabled: () => page.val <= 1,
        class: baseBtn,
        onclick: () => go(page.val - 1),
      },
      "‹",
    ),
    () => {
      const slots = pageSlots(page.val, totalPages.val, siblingCount);
      return span(
        { class: "flex items-center gap-1.5" },
        ...slots.map((slot) => {
          if (typeof slot !== "number") {
            return span(
              { class: "flex h-8 min-w-6 items-center justify-center text-muted-foreground", "aria-hidden": "true" },
              "…",
            );
          }
          const isCurrent = slot === page.val;
          return button(
            {
              type: "button",
              ...(isCurrent ? { "aria-current": "page" } : { "aria-label": String(slot) }),
              class: () =>
                cx(
                  baseBtn,
                  isCurrent ? "bg-primary text-primary-fg border-primary hover:bg-primary pointer-events-none" : "",
                ),
              onclick: () => go(slot),
            },
            String(slot),
          );
        }),
      );
    },
    button(
      {
        type: "button",
        "aria-label": t("pagination.next", "Siguiente"),
        disabled: () => page.val >= totalPages.val,
        class: baseBtn,
        onclick: () => go(page.val + 1),
      },
      "›",
    ),
  );
};
