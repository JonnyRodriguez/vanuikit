import van, { type ChildDom } from "vanjs-core";
import { cx } from "../util.js";

export interface CardOptions {
  /** Shadow on hover (for clickable cards). */
  hoverable?: boolean;
  /** Padding is NOT included: the consumer decides (p-4/p-6, full-bleed). */
  class?: string;
  [key: string]: any;
}

/** Card-like container: surface + border + subtle shadow. */
export const Card = (props: CardOptions = {}, ...children: ChildDom[]): ChildDom =>
  van.tags.div(
    {
      class: () =>
        cx(
          "rounded-xl border border-border bg-card shadow-sm",
          props.hoverable ? "transition-shadow hover:shadow-md" : "",
          props.class,
        ),
    },
    ...children,
  );

export interface CardTitleOptions {
  class?: string;
  [key: string]: any;
}

/** Standard card title (h3). */
export const CardTitle = (props: CardTitleOptions = {}, ...children: ChildDom[]): ChildDom =>
  van.tags.h3({ class: cx("text-base font-semibold text-foreground", props.class) }, ...children);
