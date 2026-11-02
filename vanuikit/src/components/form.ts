import van, { type ChildDom, type State } from "vanjs-core";
import { Field } from "./field.js";

const FORM_BASE_CLASSES = "space-y-3";

/**
 * =========================================================================
 * FORM CONTRACT (Form v3)
 *
 * The form orchestrates a single flow (the "99% case") that can be
 * overridden with hooks for the remaining 1%:
 *
 *   idle → validate on the client (schema or field validators)
 *          → on failure: paint errors and stay put
 *        → submitting (button disabled, no double submit)
 *        → await onSubmit(data)
 *          → { ok: true }            → onSuccess (default: clears)
 *          → { ok: false, error }    → general line
 *          → { ok: false, fieldErrors } → applied with setError per field
 *        → idle
 *
 * Double validation: the client validates for UX (fast, no network); the
 * server ALWAYS re-validates with THE SAME schema (security). The schema
 * lives in the `shared/` layer and is imported on both sides.
 * =========================================================================
 */

/** Backend / onSubmit result — the contract that binds client and server. */
export type FormResult =
  | { ok: true }
  | { ok: false; error?: string; fieldErrors?: Record<string, string> };

/**
 * Minimal (structural) shape of a shared schema. Compatible with zod:
 * `z.object({...})` satisfies this interface without coupling to zod.
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
  /** Shared schema (zod or compatible). Optional: without it, field validators are used. */
  schema?: SchemaLike;
  /** Sends the data to the backend. Must return the FormResult contract. */
  onSubmit(data: Record<string, unknown>): Promise<FormResult> | FormResult;
  /** Hook before validating (1%). */
  onBeforeValidate?(data: Record<string, unknown>): void;
  /** Hook after validation passes, before submitting (1%). */
  onBeforeSubmit?(data: Record<string, unknown>): void;
  /** Hook on success. Default: clears the errors. */
  onSuccess?(data: Record<string, unknown>, result: ExtractOk<FormResult>): void;
  /** Hook on error. Default: paints general line / fieldErrors. */
  onError?(result: ExtractFail<FormResult>): void;
}

/** Legacy handler (compat): returns `void | { ok } | { error }`. It is normalized. */
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
  /** Registers fields; returns the form for chaining. */
  add(...fields: Field[]): Form;
  /** The <form> with the fields and the footer; validates on every submit. */
  dom(...footer: ChildDom[]): ChildDom;
  /** true while onSubmit runs (disables button, blocks double submit). */
  readonly submitting: State<boolean>;
  /** General error line (client or backend). */
  readonly error: State<string>;
  /** Per-field errors (backend). Applied with setError. */
  readonly fieldErrors: State<Record<string, string>>;
  /** Clears the general line, the fieldErrors and the field errors. */
  clear(): void;
};

/**
 * Form — factory with a unified contract. Coordinates the 99% flow: validates,
 * shows errors (per field or general), protects against double submit and
 * applies the backend response with the same contract on both ends.
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
   * Applies per-field errors via setError. Returns the first message that
   * could not be mapped to a registered field (for the general line). */
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
    if (submitting.val) return; // no double submit

    const formEl = e.target as HTMLFormElement;
    const data = Object.fromEntries(
      new FormData(formEl).entries(),
    ) as Record<string, unknown>;

    error.val = ""; // clears the general line for this attempt
    options.onBeforeValidate?.(data);

    // Client validation: shared schema (if any) or field validators.
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
