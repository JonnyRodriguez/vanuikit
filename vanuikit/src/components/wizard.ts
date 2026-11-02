import van, { type ChildDom, type State } from "vanjs-core";
import type { FormResult, SchemaLike } from "./form.js";
import { Button } from "./button.js";
import { raw, t } from "../i18n.js";

type ExtractOk<R> = R extends { ok: true } ? R : never;
type ExtractFail<R> = R extends { ok: false } ? R : never;

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
export const Wizard = (options: WizardOptions): WizardHandle => {
  const { div, h3, p } = van.tags;

  const steps = options.steps;
  const stepIndex = van.state(0);
  const store = van.state<Record<string, unknown>>({});
  const error = van.state("");
  const submitting = van.state(false);

  // Índice de paso por campo → para ruteo de fieldErrors del backend.
  const fieldStep = new Map<string, number>();
  steps.forEach((s, i) => (s.fields ?? []).forEach((f) => fieldStep.set(f.name, i)));

  const collect = (step: WizardStep): Record<string, unknown> => {
    if (step.collect) return step.collect();
    const data: Record<string, unknown> = {};
    for (const f of step.fields ?? []) data[f.name] = f.value.val;
    return data;
  };

  /** Aplica errores por campo al paso actual; devuelve el primer no mapeado. */
  const applyErrors = (map: Record<string, string>): string | undefined => {
    const step = steps[stepIndex.val];
    let unmapped: string | undefined;
    for (const [name, msg] of Object.entries(map)) {
      const f = (step.fields ?? []).find((x) => x.name === name);
      if (f) f.setError(msg);
      else if (!unmapped) unmapped = msg;
    }
    return unmapped;
  };

  /** Valida un paso; devuelve los datos del paso (mergeados con el store) o null. */
  const validateStep = (index: number): Record<string, unknown> | null => {
    const step = steps[index];
    const data = { ...store.val, ...collect(step) };
    error.val = "";

    if (step.schema) {
      const parsed = step.schema.safeParse(data);
      if (!parsed.success && parsed.error) {
        const map: Record<string, string> = {};
        for (const issue of parsed.error.issues) {
          const key = String(issue.path[0] ?? "");
          if (key && !(key in map)) map[key] = issue.message;
        }
        const unmapped = applyErrors(map);
        if (unmapped !== undefined) error.val = unmapped;
        return null;
      }
    } else {
      let ok = true;
      for (const f of step.fields ?? []) if (!f.validate(data)) ok = false;
      if (!ok) return null;
    }
    return data;
  };

  const commit = (data: Record<string, unknown>) => {
    store.val = { ...store.val, ...data };
  };

  /** Navega a un paso, sembrando el store en sus campos (re-entrada). */
  const goTo = (nextIndex: number) => {
    const clamped = Math.max(0, Math.min(steps.length - 1, nextIndex));
    const step = steps[clamped];
    for (const f of step.fields ?? []) {
      const v = store.val[f.name];
      if (v !== undefined) f.value.val = v;
    }
    stepIndex.val = clamped;
    error.val = "";
    options.onStepChange?.(clamped);
  };

  const next = (): boolean => {
    const data = validateStep(stepIndex.val);
    if (!data) return false;
    commit(data);
    goTo(stepIndex.val + 1);
    return true;
  };

  const back = () => goTo(stepIndex.val - 1);

  /** Recolecta los datos de un paso (default: actual) mergeados con el store. */
  const collectStep = (index: number = stepIndex.val): Record<string, unknown> => ({
    ...store.val,
    ...collect(steps[index]),
  });

  /** Valida el paso actual sin avanzar. */
  const validateCurrent = (): boolean => validateStep(stepIndex.val) !== null;

  const submit = async () => {
    const data = validateStep(stepIndex.val);
    if (!data) return;
    commit(data);
    if (submitting.val) return;

    submitting.val = true;
    let result: FormResult;
    try {
      result = await options.onSubmit(store.val);
    } catch (err) {
      result = { ok: false, error: err instanceof Error ? err.message : "Error inesperado" };
    } finally {
      submitting.val = false;
    }

    if (result.ok) {
      options.onSuccess?.(store.val, result);
      return;
    }

    let general = result.error;
    if (result.fieldErrors) {
      const byStep: Record<number, Record<string, string>> = {};
      let unmapped: string | undefined;
      for (const [name, msg] of Object.entries(result.fieldErrors)) {
        const idx = fieldStep.get(name);
        if (idx === undefined) {
          if (!unmapped) unmapped = msg;
          continue;
        }
        (byStep[idx] ??= {})[name] = msg;
      }

      // Errores del paso visible → se pintan en sus campos.
      if (byStep[stepIndex.val]) {
        const um = applyErrors(byStep[stepIndex.val]);
        if (um !== undefined && general === undefined) general = um;
      }

      // Errores de otros pasos → hint general ("revisa el paso N").
      const otherSteps = Object.keys(byStep)
        .map(Number)
        .filter((i) => i !== stepIndex.val);
      if (otherSteps.length) {
        general =
          general ??
          raw("wizard.checkSteps", "Check step {pasos}", {
            pasos: otherSteps.map((i) => i + 1).join(", "),
          });
      } else if (unmapped !== undefined && general === undefined) {
        general = unmapped;
      }
    }
    if (general !== undefined) error.val = general;
    options.onError?.({ ok: false, error: general, fieldErrors: result.fieldErrors });
  };

  const currentTitle = van.derive(() => {
    const title = steps[stepIndex.val].title;
    return typeof title === "object" ? title.val : title;
  });

  const stepLine = van.derive(() =>
    raw("wizard.step", "Step {actual} of {total}", {
      actual: stepIndex.val + 1,
      total: steps.length,
    }),
  );

  const indicators = van.derive(() =>
    div(
      { class: "flex flex-wrap gap-2 mb-4" },
      steps.map((s, i) => {
        const done = i < stepIndex.val;
        const active = i === stepIndex.val;
        return div(
          {
            class:
              "text-xs px-3 py-1 rounded-full border " +
              (active
                ? "border-accent bg-accent/10 text-accent"
                : done
                  ? "border-border text-foreground-soft"
                  : "border-border text-foreground-soft opacity-60"),
          },
          `${i + 1}. `,
          s.title,
        );
      }),
    ),
  );

  const stepView = van.derive(() =>
    div(
      { class: "wizard-step space-y-3" },
      ...(steps[stepIndex.val].fields ?? []).map((f) => f.dom()),
      ...(steps[stepIndex.val].content ?? []),
    ),
  );

  const footer = van.derive(() => {
    const isLast = stepIndex.val === steps.length - 1;
    const controls: ChildDom[] = [];
    if (stepIndex.val > 0) {
      controls.push(
        Button(
          { type: "button", variant: "secondary", class: "w-auto px-4", onclick: back },
          t("wizard.back", "Back"),
        ),
      );
    }
    controls.push(
      Button(
        {
          type: "button",
          class: "w-auto px-4",
          disabled: submitting.val,
          onclick: isLast ? submit : next,
        },
        isLast ? t("wizard.submit", "Submit") : t("wizard.next", "Next"),
      ),
    );
    return div({ class: "flex justify-between pt-4 gap-2" }, ...controls);
  });

  return {
    dom() {
      return div(
        { class: "space-y-4" },
        () => indicators.val,
        div(
          { class: "flex items-center justify-between flex-wrap gap-2" },
          h3({ class: "text-lg font-semibold text-foreground" }, () => stepLine.val),
          div({ class: "text-sm text-foreground-soft" }, () => currentTitle.val),
        ),
        div({ class: "wizard-body" }, () => stepView.val),
        () => (error.val ? p({ class: "text-destructive text-sm" }, error.val) : ""),
        () => footer.val,
      );
    },
    get step() {
      return stepIndex;
    },
    get store() {
      return store;
    },
    get submitting() {
      return submitting;
    },
    get error() {
      return error;
    },
    next,
    back,
    goTo,
    collectStep,
    validateCurrent,
  };
};
