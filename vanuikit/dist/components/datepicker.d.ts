import { type State } from "vanjs-core";
import { type ControlField } from "./checkable.js";
import type { ToggleText } from "./checkbox.js";
export interface DatePickerOptions {
    /** Nombre del campo (id de label + hidden input para FormData). */
    name?: string;
    /**
     * Fecha seleccionada; acepta `Date` o `State<Date | null>` para enlace
     * bidireccional (mismo contrato que el resto del catálogo).
     */
    value?: Date | null | State<Date | null>;
    /** Etiqueta opcional del campo (se renderiza un <label>). */
    label?: ToggleText;
    placeholder?: ToggleText;
    disabled?: boolean | State<boolean>;
    /** Requerido: error al enviar sin fecha (integración con `Form`). */
    required?: boolean;
    requiredMsg?: ToggleText;
    /**
     * Fecha mínima seleccionable (los días previos se deshabilitan).
     * Acepta un `State<Date | null>` para límites reactivos.
     */
    min?: Date | null | State<Date | null>;
    /**
     * Fecha máxima seleccionable (los días posteriores se deshabilitan).
     * Acepta un `State<Date | null>` para límites reactivos.
     */
    max?: Date | null | State<Date | null>;
    /** true = calendario siempre visible (sin input/popup). */
    inline?: boolean;
    /** Primer día de semana: 0=domingo … 6=sábado (default 1 = lunes). */
    firstDayOfWeek?: number;
    class?: string;
    [key: string]: any;
}
export interface DatePickerField extends ControlField<{
    dom(): HTMLElement;
}> {
}
/**
 * DatePicker — calendario de selección de fecha inspirado en la interacción
 * de jQuery UI DatePicker (navegación por mes, grid de días, popup inline),
 * pero con localización vía `Intl` (meses/días/headers salen del locale) en
 * lugar de patrones manuales, y reactivo a cambio de idioma.
 *
 * Soporta dos modos: `inline` (calendario siempre visible) y popup (input
 * read-only que abre el calendario al hacer click). Implementa el contrato
 * `Field` (vía `createControlField`), así que se integra a `Form` y a los
 * validadores como cualquier otro campo.
 *
 * Teclado del grid: flechas (día/semana), PageUp/PageDown (mes),
 * Shift+PageUp/PageDown (año), Home/End (primero/último del mes),
 * Ctrl+Home/End (primero/último del año), Enter (seleccionar), Esc (cerrar).
 */
export declare const DatePicker: (props: DatePickerOptions) => DatePickerField;
//# sourceMappingURL=datepicker.d.ts.map