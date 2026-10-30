import { type ChildDom, type ValidChildDomValue } from "vanjs-core";
import type { ToggleText } from "./checkbox.js";
export type PopoverPosition = "top" | "bottom" | "left" | "right";
export interface PopoverOptions {
    /** Elemento disparador (p. ej. un Button). El click alterna el panel. */
    trigger: ChildDom;
    position?: PopoverPosition;
    ariaLabel?: ToggleText;
    /**
     * Fábrica del contenido (se evalúa en cada apertura, como TabItem.content).
     * Recibe `close()` para que el propio panel pueda cerrarse.
     */
    content: (close: () => void) => ValidChildDomValue;
    /** Clase extra para el panel (ancho mínimo, padding, etc.). */
    panelClass?: string;
    class?: string;
    [key: string]: any;
}
/**
 * Panel flotante genérico anclado al trigger: se abre/cierra con click,
 * se cierra con Esc o click fuera, y devuelve el foco al trigger.
 * El contenido viaja como fábrica `content(close)` para reconstruirse
 * (y re-suscribirse) en cada apertura.
 *
 * Misma limitación que Tooltip: posicionamiento CSS, un ancestro con
 * `overflow: hidden` puede recortar el panel.
 */
export declare const Popover: (props: PopoverOptions) => ChildDom;
//# sourceMappingURL=popover.d.ts.map