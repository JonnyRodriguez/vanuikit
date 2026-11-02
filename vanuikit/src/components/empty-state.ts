import van, { type ChildDom } from "vanjs-core";
import { cx } from "../util.js";
import type { ToggleText } from "./checkbox.js";
import { Icon } from "./icon.js";

export interface EmptyStateOptions {
  /** Decorative icon (ChildDom); defaults to Icon "inbox". */
  icon?: ChildDom;
  title: ToggleText;
  description?: ToggleText;
  /** Action slot (e.g. a Button that opens the creation flow). */
  action?: ChildDom;
  class?: string;
  [key: string]: any;
}

/**
 * Empty state for a view or section: icon, title, description and
 * primary action. Text is always provided by the consumer via `t()`;
 * the component only provides the layout.
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
    div(
      { class: "text-3xl text-muted-foreground/60", "aria-hidden": "true" },
      props.icon ?? Icon({ name: "inbox", class: "size-9" }),
    ),
    p({ class: "text-sm font-semibold text-foreground" }, props.title),
    props.description
      ? p({ class: "max-w-sm text-xs text-foreground-soft" }, props.description)
      : null,
    props.action ? div({ class: "pt-2" }, props.action) : null,
  );
};
