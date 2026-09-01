import van, { type State, type ChildDom } from "vanjs-core";
import { navigate } from "../router.js";
import { cx } from "../util.js";

export type LinkVariant = "default" | "muted" | "accent" | "button";

export interface LinkProps {
  href: string;
  class?: string;
  variant?: LinkVariant;
  replace?: boolean;
  external?: boolean;
  target?: string;
  rel?: string;
  onclick?: (e: MouseEvent) => void;
  [key: string]: any;
}

const linkVariantClasses: Record<LinkVariant, string> = {
  default: "text-foreground hover:underline font-medium",
  muted: "text-foreground-soft hover:text-foreground hover:underline",
  accent: "text-accent hover:underline font-medium cursor-pointer",
  button: "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors",
};

/**
 * Link — Componente embebido para navegación declarativa en SPA.
 *
 * Previene la recarga de página automáticamente al hacer clic (a menos que sea externo,
 * tenga modificadores como Ctrl/Cmd o target="_blank"), ejecuta `navigate(href)`
 * y aplica estilos consistentes según la variante.
 */
export function Link(props: LinkProps, ...children: ChildDom[]): HTMLAnchorElement {
  const { a } = van.tags;
  const {
    href,
    class: customClass = "",
    variant = "accent",
    replace = false,
    external = false,
    onclick,
    ...rest
  } = props;

  const isExternal = external || href.startsWith("http://") || href.startsWith("https://") || href.startsWith("//");

  return a(
    {
      href,
      class: cx(linkVariantClasses[variant] || linkVariantClasses.accent, customClass),
      onclick: (e: MouseEvent) => {
        if (onclick) onclick(e);
        if (e.defaultPrevented || isExternal || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || props.target) return;
        e.preventDefault();
        navigate(href, { replace });
      },
      ...rest,
    },
    ...children,
  );
}

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
