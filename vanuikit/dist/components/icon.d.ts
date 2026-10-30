import { type State } from "vanjs-core";
/**
 * Icon — colección de iconos SVG de vankit (estilo Lucide, 24×24, trazo
 * `currentColor`). Reemplaza a los emojis: se tiñen con el tema y se ven
 * idénticos en toda plataforma. Todo icono del catálogo debe venir de aquí.
 */
export type IconName = "sun" | "moon" | "monitor" | "chevron-left" | "chevron-right" | "x" | "check" | "menu" | "search" | "globe" | "credit-card" | "puzzle" | "key" | "log-out" | "info" | "alert-triangle" | "bell" | "question" | "check-circle" | "x-circle" | "trash" | "inbox" | "smartphone" | "rocket" | "navigation" | "user" | "settings" | "arrow-right";
export type IconProps = {
    name: IconName;
    /** Clases de tamaño (default size-4) y extras. */
    class?: string | (() => string) | State<string>;
};
/**
 * Icon — <svg> con namespace real y trazo currentColor (tiñe con el texto).
 */
export declare function Icon(props: IconProps): Element;
//# sourceMappingURL=icon.d.ts.map