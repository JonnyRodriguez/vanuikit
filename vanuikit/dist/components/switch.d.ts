import { type State } from "vanjs-core";
import { type ControlField } from "./checkable.js";
import type { CheckSize, ToggleText } from "./checkbox.js";
export interface SwitchOptions {
    name?: string;
    label?: ToggleText;
    description?: ToggleText;
    checked?: boolean | State<boolean>;
    disabled?: boolean | State<boolean>;
    size?: CheckSize;
    /** Requerido: error al enviar sin activar (integración con `Form`). */
    required?: boolean;
    requiredMsg?: ToggleText;
    class?: string;
    [key: string]: any;
}
export interface SwitchField extends ControlField<{
    readonly checked: State<boolean>;
    dom(): HTMLElement;
}> {
}
/**
 * Switch accesible (`role="switch"` sobre input nativo): Space lo alterna y
 * el anuncio en lectores de pantalla es el de un interruptor. `checked`
 * acepta un State externo para enlace bidireccional; con `required`/`name`
 * se integra a `Form`.
 */
export declare const Switch: (options?: SwitchOptions) => SwitchField;
//# sourceMappingURL=switch.d.ts.map