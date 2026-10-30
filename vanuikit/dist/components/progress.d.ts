import { type State } from "vanjs-core";
import type { ToggleText } from "./checkbox.js";
export type ProgressSize = "sm" | "md" | "lg";
export interface ProgressOptions {
    /** Porcentaje 0–100 (se acota); acepta State para barra reactiva. */
    value?: number | State<number>;
    /** Barra de progreso indeterminada (pulso); ignora `value`. */
    indeterminate?: boolean | State<boolean>;
    label?: ToggleText;
    /** Muestra el porcentaje junto al label (default true; oculto si indeterminada). */
    showValue?: boolean;
    size?: ProgressSize;
    /** Clase del fill para colorearlo (default bg-accent). */
    fillClass?: string;
    class?: string;
    [key: string]: any;
}
/**
 * Barra de progreso accesible (`role="progressbar"` + aria-valuenow).
 * Determinada con `value` (acepta State para actualizarse en vivo) o
 * indeterminada con `indeterminate`.
 */
export declare const Progress: (props?: ProgressOptions) => HTMLDivElement;
//# sourceMappingURL=progress.d.ts.map