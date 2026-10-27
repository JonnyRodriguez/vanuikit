import van, { type ChildDom, type State } from "vanjs-core";
import { Field } from "./field.js";

const FORM_BASE_CLASSES = "space-y-3";

/**
 * =========================================================================
 * CONTRATO DE FORMULARIOS (Form v3)
 *
 * El formulario coordina un flujo único (el "99% de los casos") que se
 * puede sobrecargar con hooks para el 1% restante:
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
export type FormResult =
  | { ok: true }
  | { ok: false; error?: string; fieldErrors?: Record<string, string> };

/**
 * Forma mínima (estructural) de un schema compartido. Compatible con zod:
 * `z.object({...})` cumple esta interfaz sin necesidad de acoplarse a zod.
 */
export interface SchemaLike {
  safeParse(data: unknown): {
    success: boolean;
    data?: unknown;
    error?: {
      issues: Array<{ path: Array<PropertyKey>; message: string }>;
    };
  };
}

type ExtractOk<R> = R extends { ok: true } ? R : never;
type ExtractFail<R> = R extends { ok: false } ? R : never;

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
export type FormLegacyHandler = (
  data: Record<string, unknown>,
) =>
  | Promise<void | { ok?: boolean } | { error?: string }>
  | void
  | { ok?: boolean }
  | { error?: string };

export type FormConfig = FormOptions | FormLegacyHandler;

const normalizeLegacy = (
  r: Awaited<ReturnType<FormLegacyHandler>>,
): FormResult => {
  if (!r) return { ok: true };
  if (typeof r === "object" && "error" in r && r.error) {
    return { ok: false, error: r.error as string };
  }
  return { ok: true };
};

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
export const Form = (config: FormConfig): Form => {
  const options: FormOptions =
    typeof config === "function"
      ? { onSubmit: async (data) => normalizeLegacy(await config(data)) }
      : config;

  const fields: Field[] = [];
  const submitting = van.state(false);
  const error = van.state("");
  const fieldErrors = van.state<Record<string, string>>({});

  const fieldByName = (name: string) => fields.find((f) => f.name === name);

  /**
   * Aplica errores por campo vía setError. Devuelve el primer mensaje que no
   * pudo mapearse a un campo registrado (para la línea general). */
  const applyFieldErrors = (map: Record<string, string>): string | undefined => {
    let unmapped: string | undefined;
    for (const [name, msg] of Object.entries(map)) {
      const f = fieldByName(name);
      if (f) f.setError(msg);
      else if (unmapped === undefined) unmapped = msg;
    }
    return unmapped;
  };

  const clearErrors = () => {
    error.val = "";
    fieldErrors.val = {};
    for (const f of fields) f.clearError();
  };

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    if (submitting.val) return; // sin doble submit

    const formEl = e.target as HTMLFormElement;
    const data = Object.fromEntries(
      new FormData(formEl).entries(),
    ) as Record<string, unknown>;

    error.val = ""; // limpia la línea general para este intento
    options.onBeforeValidate?.(data);

    // Validación cliente: schema compartido (si hay) o validadores de campo.
    if (options.schema) {
      const parsed = options.schema.safeParse(data);
      if (!parsed.success && parsed.error) {
        const map: Record<string, string> = {};
        for (const issue of parsed.error.issues) {
          const key = String(issue.path[0] ?? "");
          if (key && !(key in map)) map[key] = issue.message;
        }
        fieldErrors.val = map;
        const unmapped = applyFieldErrors(map);
        if (unmapped !== undefined) error.val = unmapped;
        return;
      }
    } else {
      let valid = true;
      for (const f of fields) {
        if (!f.validate(data)) valid = false;
      }
      if (!valid) return;
    }

    options.onBeforeSubmit?.(data);
    clearErrors();

    let result: FormResult;
    submitting.val = true;
    try {
      result = await options.onSubmit(data);
    } catch (err) {
      result = {
        ok: false,
        error: err instanceof Error ? err.message : "Error inesperado",
      };
    } finally {
      submitting.val = false;
    }

    if (result.ok) {
      options.onSuccess?.(data, result);
      return;
    }

    let general = result.error;
    if (result.fieldErrors) {
      fieldErrors.val = result.fieldErrors;
      const unmapped = applyFieldErrors(result.fieldErrors);
      if (general === undefined && unmapped !== undefined) general = unmapped;
    }
    if (general !== undefined) error.val = general;
    options.onError?.({ ok: false, error: general, fieldErrors: result.fieldErrors });
  };

  const form: Form = {
    add(...more) {
      fields.push(...more);
      return form;
    },
    get submitting() {
      return submitting;
    },
    get error() {
      return error;
    },
    get fieldErrors() {
      return fieldErrors;
    },
    clear() {
      clearErrors();
    },
    dom(...footer) {
      return van.tags.form(
        { onsubmit: handleSubmit, class: FORM_BASE_CLASSES },
        ...fields.map((f) => f.dom()),
        ...footer,
      );
    },
  };

  return form;
};
