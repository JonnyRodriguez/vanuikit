/**
 * Validadores de campos — cada uno es una fábrica que retorna un objeto con
 * una sola responsabilidad: devolver un mensaje de error o null si pasa.
 * `data` es el conjunto de valores del formulario (para comparar campos).
 */
import type { State } from "vanjs-core";
export type ValidatorMessage = string | State<string>;
export interface Validator {
    /** Devuelve mensaje de error, o null si el valor es válido. */
    validate(value: string, data?: Record<string, unknown>): string | null;
}
export declare const Required: (msg?: ValidatorMessage) => Validator;
export declare const Email: (msg?: ValidatorMessage) => Validator;
export declare const MinLength: (min: number, msg?: ValidatorMessage) => Validator;
/** Compara contra otro campo del formulario (p. ej. confirmar contraseña). */
export declare const Match: (otherName: string, msg?: ValidatorMessage) => Validator;
//# sourceMappingURL=validators.d.ts.map