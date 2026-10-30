import { type State } from "vanjs-core";
import { type ControlField } from "./checkable.js";
import type { CheckSize, ToggleText } from "./checkbox.js";
export interface RadioOption {
    value: string;
    label: ToggleText;
    description?: ToggleText;
    disabled?: boolean | State<boolean>;
}
export interface RadioGroupOptions {
    name?: string;
    options: RadioOption[];
    /** Valor seleccionado; acepta State externo para enlace bidireccional. */
    value?: string | State<string>;
    size?: CheckSize;
    /** Etiqueta accesible del grupo (aria-label del contenedor). */
    ariaLabel?: ToggleText;
    disabled?: boolean | State<boolean>;
    /** Requerido: error al enviar sin selección (integración con `Form`). */
    required?: boolean;
    requiredMsg?: ToggleText;
    class?: string;
    [key: string]: any;
}
export interface RadioGroupField extends ControlField<{
    dom(): HTMLElement;
}> {
}
/**
 * Grupo de radios excluyentes y accesible (`role="radiogroup"`): flechas
 * ↑/↓/←/→ mueven la selección entre opciones habilitadas (roving focus),
 * Tab entra y sale del grupo. Con `required`/`name` se integra a `Form`.
 */
export declare const RadioGroup: (options: RadioGroupOptions) => RadioGroupField;
//# sourceMappingURL=radio.d.ts.map