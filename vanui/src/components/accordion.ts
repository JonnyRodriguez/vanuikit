import van, { type ChildDom, type State, type ValidChildDomValue } from "vanjs-core";
import { cx } from "../util.js";
import { readState } from "./checkable.js";
import type { ToggleText } from "./checkbox.js";

export interface AccordionItem {
  id: string;
  title: ToggleText;
  /**
   * Fábrica del contenido: se invoca en cada apertura (contenido fresco con
   * bindings frescos — misma razón por la que TabItem.content es factory).
   */
  content: () => ValidChildDomValue;
  disabled?: boolean | State<boolean>;
}

export interface AccordionOptions {
  items: AccordionItem[];
  /** Permitir varios abiertos a la vez (default: uno solo). */
  multiple?: boolean;
  /** Ids abiertos al montar. */
  defaultOpen?: string[];
  class?: string;
  [key: string]: any;
}

let nextId = 0;

/**
 * Acordeón accesible: botones con `aria-expanded`/`aria-controls` y paneles
 * `role="region"`. Con `multiple: false` (default) abrir uno cierra el
 * anterior. El contenido se construye al abrir (y re-construye en cada
 * apertura); el panel permanece montado mientras el ítem exista.
 */
export const Accordion = (props: AccordionOptions): ChildDom => {
  const { div, button, span } = van.tags;
  const uid = `vanui-accordion-${nextId++}`;
  const openIds = van.state<string[]>([...(props.defaultOpen ?? [])]);

  const toggle = (item: AccordionItem) => {
    if (readState(item.disabled, false)) return;
    const isOpen = openIds.val.includes(item.id);
    if (isOpen) {
      openIds.val = openIds.val.filter((id) => id !== item.id);
    } else if (props.multiple) {
      openIds.val = [...openIds.val, item.id];
    } else {
      openIds.val = [item.id];
    }
  };

  return div(
    { class: () => cx("accordion divide-y divide-border rounded-xl border border-border bg-card", props.class) },
    ...props.items.map((item) => {
      const regionId = `${uid}-${item.id}-region`;
      const btnId = `${uid}-${item.id}-button`;
      return div(
        {},
        button(
          {
            id: btnId,
            type: "button",
            "aria-expanded": () => (openIds.val.includes(item.id) ? "true" : "false"),
            "aria-controls": regionId,
            disabled: () => readState(item.disabled, false),
            class: () =>
              cx(
                "flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-secondary/20",
                readState(item.disabled, false) ? "cursor-not-allowed opacity-50" : "cursor-pointer",
              ),
            onclick: () => toggle(item),
          },
          span(item.title),
          span(
            {
              class: () =>
                cx(
                  "text-muted-foreground transition-transform duration-200",
                  openIds.val.includes(item.id) ? "rotate-90" : "",
                ),
              "aria-hidden": "true",
            },
            "▸",
          ),
        ),
        // Región siempre montada (ancla real); el contenido se fabrica al abrir.
        div(
          {
            id: regionId,
            role: "region",
            "aria-labelledby": btnId,
            class: () => (openIds.val.includes(item.id) ? "" : "hidden"),
          },
          () => (openIds.val.includes(item.id) ? div({ class: "px-4 pb-4 text-sm text-foreground-soft" }, item.content()) : div()),
        ),
      );
    }),
  );
};
