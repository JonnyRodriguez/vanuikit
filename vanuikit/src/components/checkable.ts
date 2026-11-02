import van, { type State } from "vanjs-core";
import type { Validator } from "../validators.js";

/**
 * Pieces shared by the selection controls (Checkbox, Switch,
 * RadioGroup): they implement the `Field` contract so they can register
 * with `Form` without duplicating error/touch/validation logic.
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
 * Full Field contract for non-textual controls: `ControlCore` plus the
 * extras of each control (e.g. `checked` or `dom`), with a chainable
 * `addValidator` on the final object.
 */
export type ControlField<T extends object = Record<string, never>> = ControlCore &
  T & {
    addValidator(validator: Validator): ControlField<T>;
  };

/** Accepts a plain value or a State; returns the given State or a new one. */
export const asState = <T>(value: T | State<T> | undefined, initial: T): State<T> =>
  value !== undefined && typeof value === "object"
    ? (value as State<T>)
    : van.state(value === undefined ? initial : (value as T));

/** Reads a plain value or a State in a non-reactive context (handlers). */
export const readState = <T>(value: T | State<T> | undefined, fallback: T): T =>
  value === undefined
    ? fallback
    : typeof value === "object"
      ? (value as State<T>).val
      : value;

export interface ControlFieldSpec {
  name: string;
  /** Canonical reactive value ("" = empty): feeds isValid and the validators. */
  value: State<string>;
  /** Current value as a string, read in validate() without external data. */
  currentValue: () => string;
  /** Syncs the control's internal state with a raw value (FormData). */
  applyValue: (raw: string) => void;
}

/**
 * Field contract factory for non-textual controls: same validation
 * mechanics as Field (validators in order, `validate(data)` from the Form,
 * setError/clearError) but delegating the value source to the control. The
 * control extras (`checked`, `dom`, ...) come in via `extra` and are
 * merged into the returned object.
 */
export const createControlField = <T extends object>(
  spec: ControlFieldSpec,
  extra: T,
  initialValidators: Validator[] = [],
): ControlField<T> => {
  const error = van.state("");
  const isTouched = van.state(false);
  const validators = [...initialValidators];

  const isValid = van.derive(() => !error.val && spec.value.val.length > 0);
  const isInvalid = van.derive(() => isTouched.val && !!error.val);
  const stateClass = van.derive(() =>
    isTouched.val
      ? isInvalid.val
        ? "field-invalid"
        : "field-valid"
      : "field-pristine",
  );

  const validate = (
    valueOrData?: string | Record<string, unknown>,
    data?: Record<string, unknown>,
  ): boolean => {
    isTouched.val = true;
    let valToTest = spec.currentValue();
    let contextData = data;

    if (typeof valueOrData === "string") {
      spec.applyValue(valueOrData);
      valToTest = valueOrData;
    } else if (valueOrData && typeof valueOrData === "object") {
      contextData = valueOrData;
      if (valueOrData[spec.name] !== undefined) {
        valToTest = String(valueOrData[spec.name]);
        spec.applyValue(valToTest);
      }
    }

    for (const v of validators) {
      const err = v.validate(valToTest, contextData);
      if (err) {
        error.val = err;
        return false;
      }
    }
    error.val = "";
    return true;
  };

  // `addValidator` after the `extra` spread: extras cannot override it.
  const control = {
    name: spec.name,
    value: spec.value,
    error,
    isTouched,
    isValid,
    isInvalid,
    stateClass,
    validate,
    setError(msg: string) {
      error.val = msg;
      isTouched.val = true;
    },
    clearError() {
      error.val = "";
    },
    addValidator(validator: Validator) {
      validators.push(validator);
      return control;
    },
    ...extra,
  } as ControlField<T>;

  return control;
};
