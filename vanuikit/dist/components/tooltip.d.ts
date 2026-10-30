import { type ChildDom, type State } from "vanjs-core";
import type { ToggleText } from "./checkbox.js";
export type TooltipPosition = "top" | "bottom" | "left" | "right";
export interface TooltipOptions {
    content: ToggleText;
    position?: TooltipPosition;
    /** Milisegundos antes de mostrar al hacer hover (default 300; el focus lo muestra al instante). */
    delay?: number;
    disabled?: boolean | State<boolean>;
    /** Clase extra para la burbuja (ancho, color, etc.). */
    class?: string;
    [key: string]: any;
}
/**
 * Tooltip accesible: aparece al hacer hover (con delay) y al recibir foco
 * por teclado (al instante). Desactivado en dispositivos táctiles.
 *
 * Limitación conocida: la burbuja se posiciona con CSS dentro del flujo,
 * así que un ancestro con `overflow: hidden` puede recortarla.
 */
export declare const Tooltip: (props: TooltipOptions, trigger: ChildDom) => ChildDom;
//# sourceMappingURL=tooltip.d.ts.map