import { type ChildDom } from "vanjs-core";
import type { ToggleText } from "./checkbox.js";
export interface BreadcrumbItem {
    label: ToggleText;
    /** Si se omite, el ítem se renderiza como texto (típico en el último). */
    href?: string;
    icon?: ChildDom;
}
export interface BreadcrumbsOptions {
    items: BreadcrumbItem[];
    /** Separador entre ítems (default "/"). Decorativo: aria-hidden. */
    separator?: string;
    ariaLabel?: ToggleText;
    class?: string;
    [key: string]: any;
}
/**
 * Ruta de navegación (`<nav>` + lista): los ítems con `href` usan `Link`
 * (navegación SPA con Ctrl/Cmd+click, `target` y enlaces externos) y el
 * último lleva `aria-current="page"`.
 */
export declare const Breadcrumbs: (props: BreadcrumbsOptions) => ChildDom;
//# sourceMappingURL=breadcrumbs.d.ts.map