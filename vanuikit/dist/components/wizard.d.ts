import { type ChildDom, type State } from "vanjs-core";
import type { FormResult, SchemaLike } from "./form.js";
type ExtractOk<R> = R extends {
    ok: true;
} ? R : never;
type ExtractFail<R> = R extends {
    ok: false;
} ? R : never;
/** Campo que el Wizard entiende: el contrato mínimo de Field (estructural). */
interface WizardField {
    readonly name: string;
    readonly value: State<any>;
    validate(valueOrData?: string | Record<string, unknown>, data?: Record<string, unknown>): boolean;
    setError(msg: string): void;
    clearError(): void;
    dom(): HTMLElement;
}
export interface WizardStep {
    /** Título del paso (se muestra en el indicador y el encabezado). */
    title: string | State<string>;
    /** Esquema de este paso (zod-like) — fuente primaria de validación al avanzar. */
    schema?: SchemaLike;
    /** Campos: se renderizan, alimentan el store y se usan como fallback de validación. */
    fields?: WizardField[];
    /** Nodes extra que se renderizan bajo los campos (componentes embebidos, etc.). */
    content?: ChildDom[];
    /** Recolecta los valores estructurados del paso. Default: desde `fields`. */
    collect?(): Record<string, unknown>;
}
export interface WizardOptions {
    steps: WizardStep[];
    /** Envía los datos acumulados de todos los pasos (contrato FormResult). */
    onSubmit(data: Record<string, unknown>): Promise<FormResult> | FormResult;
    onStepChange?(index: number): void;
    onSuccess?(data: Record<string, unknown>, result: ExtractOk<FormResult>): void;
    onError?(result: ExtractFail<FormResult>): void;
}
export type WizardHandle = {
    dom(): HTMLElement;
    /** Índice del paso actual (0-based). */
    readonly step: State<number>;
    /** Store estructurado con los valores acumulados. */
    readonly store: State<Record<string, unknown>>;
    /** true mientras onSubmit corre (deshabilita, bloquea doble submit). */
    readonly submitting: State<boolean>;
    /** Línea de error general (cliente o backend). */
    readonly error: State<string>;
    /** Navegación programática (useWizard). */
    /** Valida el paso actual y avanza; devuelve true si logró avanzar. */
    next(): boolean;
    /** Retrocede un paso sin validar. */
    back(): void;
    /** Salta a un paso (sembrando el store). No valida pasos intermedios. */
    goTo(index: number): void;
    /** Recolecta los datos de un paso (default: el actual) mergeados con el store. */
    collectStep(index?: number): Record<string, unknown>;
    /** Valida el paso actual sin avanzar; true si es válido. */
    validateCurrent(): boolean;
};
/**
 * Wizard — fábrica para formularios grandes partidos en pantallas (p. ej. un
 * anuncio estilo MercadoLibre). Reusa el contrato de `Form` v3:
 *
 *   · store estructurado compartido (los pasos se desmontan, el valor permanece)
 *   · validación POR PASO al avanzar (schema del paso o validadores de campo)
 *   · submit final con el mismo `FormResult` que el backend
 *   · `fieldErrors` del backend se rutean al paso que contiene cada campo;
 *     si apuntan a otro paso, caen en la línea general con un hint.
 */
export declare const Wizard: (options: WizardOptions) => WizardHandle;
export {};
//# sourceMappingURL=wizard.d.ts.map