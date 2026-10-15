import van, { type State, type ChildDom } from "vanjs-core";
import { spaClick } from "../router.js";
import { t } from "../i18n.js";
import { cx, isRouteActive } from "../util.js";
import { VARIANT_CLASSES as BUTTON_VARIANTS, SIZE_CLASSES as BUTTON_SIZES } from "./button.js";

export type LinkVariant = "default" | "muted" | "accent" | "button" | "none";

export interface LinkProps {
  href: string;
  class?: string;
  variant?: LinkVariant;
  /** Navega con history.replaceState en vez de pushState. */
  replace?: boolean;
  /** Trata el enlace como externo aunque apunte a una ruta interna. */
  external?: boolean;
  target?: string;
  rel?: string;
  title?: string;
  download?: string;
  onclick?: (e: MouseEvent) => void;
  [key: string]: any;
}

const linkVariantClasses: Record<LinkVariant, string> = {
  default: "text-foreground hover:underline font-medium",
  muted: "text-foreground-soft hover:text-foreground hover:underline",
  accent: "text-accent hover:text-accent-hover hover:underline font-medium cursor-pointer",
  // Misma apariencia que Button (variante primary, tamaño md), sobre un <a>.
  button: cx(
    "inline-flex items-center justify-center rounded-md border border-transparent font-semibold transition duration-200 ease-in-out cursor-pointer",
    BUTTON_VARIANTS.primary,
    BUTTON_SIZES.md,
  ),
  // Sin clases base: para consumidores que aportan el estilo completo
  // (p. ej. Nav con su estado activo) y siguen queriendo el plumbing de Link.
  none: "",
};

/**
 * Link — ancla con navegación SPA embebida: el click ejecuta `navigate(href)`
 * en vez de recargar la página. Respeta la decisión del consumidor (un
 * `preventDefault` en `onclick` cancela la navegación) y la del usuario
 * (modificadores, `target` o enlace externo abren de forma nativa).
 */
export function Link(props: LinkProps, ...children: ChildDom[]): HTMLAnchorElement {
  const { a } = van.tags;
  const {
    href,
    class: customClass = "",
    variant = "accent",
    replace = false,
    external = false,
    target,
    rel,
    title,
    download,
    onclick,
    ...rest
  } = props;

  return a(
    {
      href,
      class: cx(linkVariantClasses[variant], customClass),
      // Claves presentes solo con valor: van escribiría attrs "undefined".
      ...(target ? { target } : {}),
      // Los enlaces que abren pestaña nueva no delegan window.opener.
      ...(target === "_blank" && !rel ? { rel: "noopener noreferrer" } : rel ? { rel } : {}),
      ...(title ? { title } : {}),
      ...(download ? { download } : {}),
      onclick: (e: MouseEvent) => {
        if (onclick) onclick(e);
        spaClick(e, href, { replace, external, target });
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
  /** Nombre accesible del menú; por defecto se resuelve con i18n ("Navegación principal"). */
  ariaLabel?: string | State<string>;
  class?: string;
};

/**
 * Nav — menú horizontal de links, contraparte en fila del Sidebar.
 *
 * Los items los define el consumidor; `current` marca el activo (coincidencia
 * exacta o por subruta) con clase destacada y `aria-current="page"`. Los
 * clicks navegan embebidos por el router de vanui, sin recargar la página.
 * Solo estila el componente: el layout de página (centrado, márgenes) lo
 * aporta el consumidor vía `class`.
 */
export const Nav = (links: NavLink[], props: NavProps) => {
  const { nav } = van.tags;
  const { current, ariaLabel, class: extra } = props;

  // Resuelto una sola vez: t() crea un derive nuevo por llamada, y este
  // binding reacciona al idioma sin registrar derivaciones en cada re-render.
  const resolvedLabel = ariaLabel ?? t("nav.ariaLabel", "Navegación principal");

  const getCurrent = () =>
    typeof current === "object" && current !== null && "val" in current
      ? (current as State<string>).val
      : (current as string);

  return nav(
    {
      class: cx("flex flex-wrap items-center gap-x-4 gap-y-1", extra),
      "aria-label": () =>
        typeof resolvedLabel === "object" && "val" in resolvedLabel ? resolvedLabel.val : resolvedLabel,
    },
    links.map((link) =>
      // Re-render por link (mismo idioma que SidebarItem): clase activa y
      // aria-current se escriben de forma atómica, sin derivaciones que
      // sobrevivan al desmonte del árbol. Los anchors son Link (variante
      // "none" + estilo propio): mismo plumbing de navegación para todos.
      () => {
        const isActive = isRouteActive(getCurrent(), link.href);
        return Link(
          {
            href: link.href,
            variant: "none",
            class: cx(
              "text-accent no-underline text-[0.9rem] hover:underline transition-colors cursor-pointer",
              isActive && "font-bold",
            ),
            ...(isActive ? { "aria-current": "page" } : {}),
          },
          link.label,
        );
      },
    ),
  );
};
