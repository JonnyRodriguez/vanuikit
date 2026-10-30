import { type ChildDom } from "vanjs-core";
import type { ToggleText } from "./checkbox.js";
export type AlertVariant = "info" | "success" | "warning" | "error";
export interface AlertOptions {
    variant?: AlertVariant;
    title?: ToggleText;
    showIcon?: boolean;
    /** Ícono personalizado (default: Icon según variante). */
    icon?: ChildDom;
    /** Muestra el botón de cierre; al cerrar, el aviso queda oculto. */
    dismissible?: boolean;
    onDismiss?: () => void;
    class?: string;
    children?: any;
    [key: string]: any;
}
/**
 * Aviso estático (a diferencia de `toast`, que es transitorio): errores de
 * formulario persistentes, banners de estado, confirmaciones inline.
 * Uso: Alert({ variant: "error", title }, "Mensaje del aviso").
 */
export declare const Alert: (props?: AlertOptions, ...children: ChildDom[]) => HTMLDivElement;
//# sourceMappingURL=alert.d.ts.map