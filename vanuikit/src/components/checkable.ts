import van, { type State } from "vanjs-core";
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
export type ControlField<T extends object = Record<string, never>> = ControlCore &
  T & {
    addValidator(validator: Validator): ControlField<T>;
  };

/** Acepta un valor plano o un State; devuelve el State recibido o uno propio. */
export const asState = <T>(value: T | State<T> | undefined, initial: T): State<T> =>
  value !== undefined && typeof value === "object"
    ? (value as State<T>)
    : van.state(value === undefined ? initial : (value as T));

/** Lee un valor plano o un State en un contexto no reactivo (handlers). */
export const readState = <T>(value: T | State<T> | undefined, fallback: T): T =>
  value === undefined
    ? fallback
    : typeof value === "object"
      ? (value as State<T>).val
      : value;

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

  // `addValidator` después del spread de `extra`: los extras no pueden pisarlo.
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
