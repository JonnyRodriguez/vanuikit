import van, { type ChildDom, type State } from "vanjs-core";
import type { FormResult, SchemaLike } from "./form.js";
import { Button } from "./button.js";
import { raw, t } from "../i18n.js";

type ExtractOk<R> = R extends { ok: true } ? R : never;
type ExtractFail<R> = R extends { ok: false } ? R : never;

/** Field the Wizard understands: the minimal Field contract (structural). */
interface WizardField {
  readonly name: string;
  readonly value: State<any>;
  validate(valueOrData?: string | Record<string, unknown>, data?: Record<string, unknown>): boolean;
  setError(msg: string): void;
  clearError(): void;
  dom(): HTMLElement;
}

export interface WizardStep {
  /** Step title (shown in the indicator and the header). */
  title: string | State<string>;
  /** Schema of this step (zod-like) — primary validation source when advancing. */
  schema?: SchemaLike;
  /** Fields: rendered, feed the store and serve as validation fallback. */
  fields?: WizardField[];
  /** Extra nodes rendered below the fields (embedded components, etc.). */
  content?: ChildDom[];
  /** Collects the structured values of the step. Default: from `fields`. */
  collect?(): Record<string, unknown>;
}

export interface WizardOptions {
  steps: WizardStep[];
  /** Sends the accumulated data of all steps (FormResult contract). */
  onSubmit(data: Record<string, unknown>): Promise<FormResult> | FormResult;
  onStepChange?(index: number): void;
  onSuccess?(data: Record<string, unknown>, result: ExtractOk<FormResult>): void;
  onError?(result: ExtractFail<FormResult>): void;
}

export type WizardHandle = {
  dom(): HTMLElement;
  /** Index of the current step (0-based). */
  readonly step: State<number>;
  /** Structured store with the accumulated values. */
  readonly store: State<Record<string, unknown>>;
  /** true while onSubmit runs (disables, blocks double submit). */
  readonly submitting: State<boolean>;
  /** General error line (client or backend). */
  readonly error: State<string>;
  /** Programmatic navigation (useWizard). */
  /** Validates the current step and advances; returns true if it managed to advance. */
  next(): boolean;
  /** Goes back one step without validating. */
  back(): void;
  /** Jumps to a step (seeding the store). Does not validate intermediate steps. */
  goTo(index: number): void;
  /** Collects the data of a step (default: the current one) merged with the store. */
  collectStep(index?: number): Record<string, unknown>;
  /** Validates the current step without advancing; true if valid. */
  validateCurrent(): boolean;
};

/**
 * Wizard — factory for large forms split across screens (e.g. a
 * marketplace-style listing). Reuses the `Form` v3 contract:
 *
 *   · shared structured store (steps unmount, the value persists)
 *   · PER-STEP validation when advancing (step schema or field validators)
 *   · final submit with the same `FormResult` as the backend
 *   · backend `fieldErrors` are routed to the step containing each field;
 *     if they point at another step, they land in the general line with a hint.
 */
export const Wizard = (options: WizardOptions): WizardHandle => {
  const { div, h3, p } = van.tags;

  const steps = options.steps;
  const stepIndex = van.state(0);
  const store = van.state<Record<string, unknown>>({});
  const error = van.state("");
  const submitting = van.state(false);

  // Step index per field → for routing backend fieldErrors.
  const fieldStep = new Map<string, number>();
  steps.forEach((s, i) => (s.fields ?? []).forEach((f) => fieldStep.set(f.name, i)));

  const collect = (step: WizardStep): Record<string, unknown> => {
    if (step.collect) return step.collect();
    const data: Record<string, unknown> = {};
    for (const f of step.fields ?? []) data[f.name] = f.value.val;
    return data;
  };

  /** Applies per-field errors to the current step; returns the first unmapped one. */
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

  /** Validates a step; returns the step data (merged with the store) or null. */
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

  /** Navigates to a step, seeding the store into its fields (re-entry). */
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

  /** Collects the data of a step (default: current) merged with the store. */
  const collectStep = (index: number = stepIndex.val): Record<string, unknown> => ({
    ...store.val,
    ...collect(steps[index]),
  });

  /** Validates the current step without advancing. */
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

      // Errors of the visible step → painted on its fields.
      if (byStep[stepIndex.val]) {
        const um = applyErrors(byStep[stepIndex.val]);
        if (um !== undefined && general === undefined) general = um;
      }

      // Errors of other steps → general hint ("check step N").
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
                ? "border-accent bg-accent/10 text-accent-fg"
                : done
                  ? "border-border text-foreground-soft"
                  : "border-border text-muted-foreground"),
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
