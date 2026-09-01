import van, { type State } from "vanjs-core";
import { cx } from "../util.js";

export type NavLink = {
  href: string;
  label: string | State<string> | (() => string | Node);
};

type NavProps = {
  /** Ruta del link actual (string o State reactivo); recibe la clase activa y aria-current. */
  current: string | State<string>;
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

  const isState = typeof current === "object" && current !== null && "val" in current;

  return nav(
    {
      class: cx(
        "flex flex-wrap gap-4 max-w-180 mx-auto mt-4 px-5",
        extra,
      ),
      "aria-label": "Principal",
    },
    links.map((link) => {
      const getIsCurrent = () => (isState ? (current as State<string>).val : current) === link.href;

      const linkEl = a(
        {
          href: link.href,
          class: () =>
            cx(
              "text-accent no-underline text-[0.9rem] hover:underline transition-colors",
              getIsCurrent() && "font-bold",
            ),
        },
        link.label,
      );

      van.derive(() => {
        if (getIsCurrent()) {
          linkEl.setAttribute("aria-current", "page");
        } else {
          linkEl.removeAttribute("aria-current");
        }
      });

      return linkEl;
    }),
  );
};
