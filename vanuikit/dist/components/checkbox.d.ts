import { type State } from "vanjs-core";
import { type ControlField } from "./checkable.js";
export type ToggleText = string | State<string>;
export type CheckSize = "sm" | "md" | "lg";
export interface CheckboxOptions {
    name?: string;
    label?: ToggleText;
    description?: ToggleText;
    checked?: boolean | State<boolean>;
    indeterminate?: boolean | State<boolean>;
    disabled?: boolean | State<boolean>;
    size?: CheckSize;
    /** Requerido: error al enviar sin marcar (integración con `Form`). */
    required?: boolean;
    requiredMsg?: ToggleText;
    class?: string;
    [key: string]: any;
}
export interface CheckboxField extends ControlField<{
    readonly checked: State<boolean>;
    dom(): HTMLElement;
}> {
}
/**
 * Checkbox accesible (input nativo + caja estilizada): Space lo alterna,
 * el click en label/description también. `checked` acepta un State externo
 * para enlace bidireccional. Con `required`/`name` se integra a `Form`.
 */
export declare const Checkbox: (options?: CheckboxOptions) => CheckboxField;
//# sourceMappingURL=checkbox.d.ts.map