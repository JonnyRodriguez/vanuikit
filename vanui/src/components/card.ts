import van, { type ChildDom } from "vanjs-core";
import { cx } from "../util.js";

export interface CardOptions {
  /** Sombra al pasar el mouse (para tarjetas clickeables). */
  hoverable?: boolean;
  /** El padding NO va incluido: el consumidor decide (p-4/p-6, full-bleed). */
  class?: string;
  [key: string]: any;
}

/** Contenedor tipo tarjeta: superficie + borde + sombra sutil. */
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

/** Título estándar de tarjeta (h3). */
export const CardTitle = (props: CardTitleOptions = {}, ...children: ChildDom[]): ChildDom =>
  van.tags.h3({ class: cx("text-base font-semibold text-foreground", props.class) }, ...children);
