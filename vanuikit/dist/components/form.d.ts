import { type ChildDom, type State } from "vanjs-core";
import { Field } from "./field.js";
/**
 * =========================================================================
 * CONTRATO DE FORMULARIOS (Form v3)
 *
 * El formulario coordina un flujo único (el "99% de los casos") que se
 * puede sob***REMOVED***r con hooks para el 1% restante:
 *
 *   idle → validar en cliente (schema o validadores de campo)
 *          → si falla: pinta errores y se queda
 *        → submitting (botón deshabilitado, sin doble submit)
 *        → await onSubmit(data)
 *          → { ok: true }            → onSuccess (default: limpia)
 *          → { ok: false, error }    → línea general
 *          → { ok: false, fieldErrors } → se aplican con setError por campo
 *        → idle
 *
 * Doble validación: el cliente valida para UX (rápido, sin red); el server
 * SIEMPRE re-valida con EL MISMO schema (seguridad). El schema vive en la
 * capa `shared/` y se importa en ambos lados.
 * =========================================================================
 */
/** Resultado del backend / de onSubmit — el contrato que une cliente y server. */
export type FormResult = {
    ok: true;
} | {
    ok: false;
    error?: string;
    fieldErrors?: Record<string, string>;
};
/**
 * Forma mínima (estructural) de un schema compartido. Compatible con zod:
 * `z.object({...})` cumple esta interfaz sin necesidad de acoplarse a zod.
 */
export interface SchemaLike {
    safeParse(data: unknown): {
        success: boolean;
        data?: unknown;
        error?: {
            issues: Array<{
                path: Array<PropertyKey>;
                message: string;
            }>;
        };
    };
}
type ExtractOk<R> = R extends {
    ok: true;
} ? R : never;
type ExtractFail<R> = R extends {
    ok: false;
} ? R : never;
export interface FormOptions {
    /** Schema compartido (zod o compatible). Opcional: sin él se usan los validadores de campo. */
    schema?: SchemaLike;
    /** Envía los datos al backend. Debe devolver el contrato FormResult. */
    onSubmit(data: Record<string, unknown>): Promise<FormResult> | FormResult;
    /** Hook antes de validar (1%). */
    onBeforeValidate?(data: Record<string, unknown>): void;
    /** Hook tras pasar la validación, antes de enviar (1%). */
    onBeforeSubmit?(data: Record<string, unknown>): void;
    /** Hook al éxito. Default: limpia los errores. */
    onSuccess?(data: Record<string, unknown>, result: ExtractOk<FormResult>): void;
    /** Hook ante error. Default: pinta línea general / fieldErrors. */
    onError?(result: ExtractFail<FormResult>): void;
}
/** Handler legacy (compat): devuelve `void | { ok } | { error }`. Se normaliza. */
export type FormLegacyHandler = (data: Record<string, unknown>) => Promise<void | {
    ok?: boolean;
} | {
    error?: string;
}> | void | {
    ok?: boolean;
} | {
    error?: string;
};
export type FormConfig = FormOptions | FormLegacyHandler;
export type Form = {
    /** Registra campos; devuelve el form para encadenar. */
    add(...fields: Field[]): Form;
    /** El <form> con los campos y el footer; valida en cada submit. */
    dom(...footer: ChildDom[]): ChildDom;
    /** true mientras onSubmit corre (deshabilita botón, bloquea doble submit). */
    readonly submitting: State<boolean>;
    /** Línea de error general (cliente o backend). */
    readonly error: State<string>;
    /** Errores por campo (backend). Se aplican con setError. */
    readonly fieldErrors: State<Record<string, string>>;
    /** Limpia la línea general, los fieldErrors y los errores de campo. */
    clear(): void;
};
/**
 * Form — fábrica con contrato unificado. Coordina el flujo del 99%: valida,
 * muestra errores (por campo o generales), protege contra doble submit y
 * aplica la respuesta del backend con el mismo contrato en ambos extremos.
 */
export declare const Form: (config: FormConfig) => Form;
export {};
//# sourceMappingURL=form.d.ts.map