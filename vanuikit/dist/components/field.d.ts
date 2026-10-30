import type { State } from "vanjs-core";
import type { Validator } from "../validators.js";
export type FieldText = string | State<string>;
/**
 * =========================================================================
 * DEFINICIÓN LOCAL DE TEXTOS (TEXTS)
 * Estructura limpia para desarrollo directo sin i18n, preparada para
 * extracción automatizada de traducciones cuando sea necesario.
 * =========================================================================
 */
export declare const TEXTS: {
    email: {
        label: {
            key: string;
            default: string;
        };
        placeholder: {
            key: string;
            default: string;
        };
        required: {
            key: string;
            default: string;
        };
        invalid: {
            key: string;
            default: string;
        };
    };
    password: {
        label: {
            key: string;
            default: string;
        };
        placeholder: {
            key: string;
            default: string;
        };
        required: {
            key: string;
            default: string;
        };
        min: {
            key: string;
            default: string;
        };
    };
    name: {
        label: {
            key: string;
            default: string;
        };
        placeholder: {
            key: string;
            default: string;
        };
        required: {
            key: string;
            default: string;
        };
    };
};
export interface FieldOptions {
    label: FieldText;
    name: string;
    inputType?: string;
    placeholder?: FieldText;
    hint?: FieldText;
    disabled?: boolean | State<boolean>;
    /** Renderiza un <textarea> en lugar de <input>. */
    multiline?: boolean;
    rows?: number;
}
export interface Field {
    readonly name: string;
    readonly value: State<string>;
    readonly error: State<string>;
    readonly isTouched: State<boolean>;
    readonly isValid: State<boolean>;
    readonly isInvalid: State<boolean>;
    readonly stateClass: State<string>;
    addValidator(validator: Validator): Field;
    validate(valueOrData?: string | Record<string, unknown>, data?: Record<string, unknown>): boolean;
    dom(): HTMLElement;
    setError(msg: string): void;
    clearError(): void;
}
export declare const Field: (options: FieldOptions, initialValidators?: Validator[]) => Field;
export interface TextFieldOptions {
    label?: FieldText;
    name?: string;
    placeholder?: FieldText;
    hint?: FieldText;
    required?: boolean;
    requiredMsg?: FieldText;
}
export interface EmailFieldOptions {
    label?: FieldText;
    name?: string;
    placeholder?: FieldText;
    hint?: FieldText;
    requiredMsg?: FieldText;
    invalidMsg?: FieldText;
}
export interface PasswordFieldOptions {
    label?: FieldText;
    name?: string;
    placeholder?: FieldText;
    hint?: FieldText;
    min?: number;
    requiredMsg?: FieldText;
    minMsg?: FieldText;
}
/** Campo requerido de texto libre. Baterías incluidas con i18n global. */
export declare function TextField(options?: TextFieldOptions): Field;
export declare function TextField(label?: string, name?: string, placeholder?: string): Field;
/** Campo de correo: requerido + formato. Baterías incluidas con i18n global. */
export declare function EmailField(options?: EmailFieldOptions): Field;
export declare function EmailField(label?: string, name?: string, placeholder?: string): Field;
/** Campo de contraseña: requerido + largo mínimo. Baterías incluidas con i18n global. */
export declare function PasswordField(options?: PasswordFieldOptions): Field;
export declare function PasswordField(label?: string, name?: string, placeholder?: string, min?: number): Field;
export interface TextareaFieldOptions {
    label?: FieldText;
    name?: string;
    placeholder?: FieldText;
    hint?: FieldText;
    required?: boolean;
    requiredMsg?: FieldText;
    rows?: number;
}
/** Campo de texto multilínea. Baterías incluidas con i18n global. */
export declare function TextareaField(options?: TextareaFieldOptions): Field;
//# sourceMappingURL=field.d.ts.map