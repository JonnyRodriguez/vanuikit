import { type State } from "vanjs-core";
import type { Validator } from "../validators.js";
/**
 * Piezas compartidas por los controles de selección (Checkbox, Switch,
 * RadioGroup): implementan el contrato `Field` para poder registrarse en
 * `Form` sin duplicar la lógica de error/touch/validación.
 */
export interface ControlCore {
    readonly name: string;
    readonly value: State<string>;
    readonly error: State<string>;
    readonly isTouched: State<boolean>;
    readonly isValid: State<boolean>;
    readonly isInvalid: State<boolean>;
    readonly stateClass: State<string>;
    validate(valueOrData?: string | Record<string, unknown>, data?: Record<string, unknown>): boolean;
    setError(msg: string): void;
    clearError(): void;
}
/**
 * Contrato Field completo para controles no textuales: `ControlCore` más los
 * extras de cada control (p. ej. `checked` o `dom`), con `addValidator`
 * encadenable sobre el objeto final.
 */
export type ControlField<T extends object = Record<string, never>> = ControlCore & T & {
    addValidator(validator: Validator): ControlField<T>;
};
/** Acepta un valor plano o un State; devuelve el State recibido o uno propio. */
export declare const asState: <T>(value: T | State<T> | undefined, initial: T) => State<T>;
/** Lee un valor plano o un State en un contexto no reactivo (handlers). */
export declare const readState: <T>(value: T | State<T> | undefined, fallback: T) => T;
export interface ControlFieldSpec {
    name: string;
    /** Valor canónico reactivo ("" = vacío): alimenta isValid y a los validadores. */
    value: State<string>;
    /** Valor actual como string, leído en validate() sin datos externos. */
    currentValue: () => string;
    /** Sincroniza el estado interno del control con un valor crudo (FormData). */
    applyValue: (raw: string) => void;
}
/**
 * Fábrica del contrato Field para controles no textuales: misma mecánica de
 * validación que Field (validadores en orden, `validate(data)` desde el Form,
 * setError/clearError) pero delegando el origen del valor en el control. Los
 * extras del control (`checked`, `dom`, ...) llegan por `extra` y quedan
 * fusionados en el objeto devuelto.
 */
export declare const createControlField: <T extends object>(spec: ControlFieldSpec, extra: T, initialValidators?: Validator[]) => ControlField<T>;
//# sourceMappingURL=checkable.d.ts.map