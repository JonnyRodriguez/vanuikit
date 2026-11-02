import van, { type ChildDom } from "vanjs-core";
import { cx } from "../util.js";

export interface KbdOptions {
  size?: "sm" | "md";
  class?: string;
  [key: string]: any;
}

/** Semantic styled key (`<kbd>`): shortcuts, combos, UI hints. */
export const Kbd = (props: KbdOptions = {}, ...children: ChildDom[]): ChildDom =>
  van.tags.kbd(
    {
      class: cx(
        "inline-flex items-center justify-center rounded-md border border-border bg-secondary/30 font-mono font-semibold text-foreground shadow-2xs",
        props.size === "sm" ? "px-1 py-0.5 text-[10px]" : "px-1.5 py-0.5 text-xs",
        props.class,
      ),
    },
    ...children,
  );
