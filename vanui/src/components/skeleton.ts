import van from "vanjs-core";
import { cx } from "../util.js";

export type SkeletonVariant = "text" | "circle" | "block";

export interface SkeletonOptions {
  variant?: SkeletonVariant;
  /** Para la variante "text": número de líneas (la última queda más corta). */
  lines?: number;
  class?: string;
  [key: string]: any;
}

/**
 * Placeholder de contenido mientras carga: líneas de texto (default),
 * círculo (avatar) o bloque (tarjeta). Decorativo: `aria-hidden` para que
 * los lectores de pantalla lo ignoren.
 */
export const Skeleton = (props: SkeletonOptions = {}) => {
  const { div } = van.tags;
  const base = "animate-pulse bg-border";

  if (props.variant === "circle") {
    return div({ class: cx(base, "size-10 rounded-full", props.class), "aria-hidden": "true" });
  }
  if (props.variant === "block") {
    return div({ class: cx(base, "h-24 w-full rounded-xl", props.class), "aria-hidden": "true" });
  }

  const lines = Math.max(1, props.lines ?? 3);
  return div(
    { class: cx("space-y-2", props.class), "aria-hidden": "true" },
    ...Array.from({ length: lines }, (_, i) =>
      div({
        class: cx(base, "h-3 rounded", i === lines - 1 && lines > 1 ? "w-2/3" : "w-full"),
      }),
    ),
  );
};
