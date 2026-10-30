import { type State, type ChildDom } from "vanjs-core";
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
/**
 * Link — ancla con navegación SPA embebida: el click ejecuta `navigate(href)`
 * en vez de ***REMOVED***r la página. Respeta la decisión del consumidor (un
 * `preventDefault` en `onclick` cancela la navegación) y la del usuario
 * (modificadores, `target` o enlace externo abren de forma nativa).
 */
export declare function Link(props: LinkProps, ...children: ChildDom[]): HTMLAnchorElement;
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
 * clicks navegan embebidos por el router de vanuikit, sin ***REMOVED***r la página.
 * Solo estila el componente: el layout de página (centrado, márgenes) lo
 * aporta el consumidor vía `class`.
 */
export declare const Nav: (links: NavLink[], props: NavProps) => HTMLElement;
export {};
//# sourceMappingURL=nav.d.ts.map