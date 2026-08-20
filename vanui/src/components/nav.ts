import van from "vanjs-core";
import { cx } from "../util.js";

export type NavLink = {
  href: string;
  label: string;
};

type NavProps = {
  /** Ruta del link actual; recibe la clase activa y aria-current. */
  current: string;
  class?: string;
};

/**
 * Navegación de links. Los items los define el consumidor; `current` marca
 * el activo (clase destacada + aria-current="page" para accesibilidad).
 * Trae su formato completo (layout + links); el consumidor ajusta con
 * `class` extra si lo necesita.
 */
export const Nav = (links: NavLink[], props: NavProps) => {
  const { current, class: extra } = props;
  const { nav, a } = van.tags;

  return nav(
    {
      class: cx(
        "flex flex-wrap gap-4 max-w-180 mx-auto mt-4 px-5",
        extra,
      ),
      "aria-label": "Principal",
    },
    links.map((link) => {
      const isCurrent = link.href === current;
      return a(
        {
          href: link.href,
          class: cx(
            "text-accent no-underline text-[0.9rem] hover:underline transition-colors",
            isCurrent && "font-bold",
          ),
          ...(isCurrent ? { "aria-current": "page" } : {}),
        },
        link.label,
      );
    }),
  );
};
