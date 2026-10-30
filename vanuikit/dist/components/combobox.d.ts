import { type State } from "vanjs-core";
import { type ControlField } from "./checkable.js";
import type { ToggleText } from "./checkbox.js";
export interface ComboboxOption {
    value: string;
    label: ToggleText;
    disabled?: boolean | State<boolean>;
}
export interface ComboboxOptions {
    options: ComboboxOption[];
    name?: string;
    /**
     * Valor seleccionado; acepta State externo para enlace bidireccional.
     * Con `multiple: true` debe ser `State<string[]>`.
     */
    value?: string | State<string> | State<string[]>;
    /** Modo multi-selección: chips removibles; el panel no se cierra al elegir. */
    multiple?: boolean;
    /** Placeholder del input (default: "Buscar..."). */
    placeholder?: ToggleText;
    disabled?: boolean | State<boolean>;
    /** Requerido: error al enviar sin selección (integración con `Form`). */
    required?: boolean;
    requiredMsg?: ToggleText;
    class?: string;
    [key: string]: any;
}
export interface ComboboxField extends ControlField<{
    dom(): HTMLElement;
}> {
}
/**
 * Combobox WAI-ARIA completo (a diferencia de SelectDropdown, que es un
 * select de botón): el input filtra al teclear y concentra todo el teclado
 * — ↑/↓ navegan, Home/End saltan, Enter selecciona, Esc cierra — con
 * `aria-activedescendant` sobre el listbox. Click fuera cierra. Con
 * `required`/`name` se integra a `Form` (contrato Field).
 *
 * Con `multiple: true` la selección se muestra como chips removibles (click
 * en × o Backspace con el input vacío), elegir no cierra el panel y el
 * `value` esperado es `State<string[]>`. Limitación de Form: `FormData`
 * colapsa valores repetidos, así que en multiple usa `field.value.val` para
 * leer la selección completa.
 */
export declare const Combobox: (props: ComboboxOptions) => ComboboxField;
//# sourceMappingURL=combobox.d.ts.map