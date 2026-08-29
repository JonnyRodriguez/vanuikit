import van from "vanjs-core";
import type { State } from "vanjs-core";
import type { Validator } from "../validators.js";
import { Required, Email, MinLength } from "../validators.js";
import { i18n, t } from "../i18n.js";

export type FieldText = string | State<string>;

/**
 * =========================================================================
 * DEFINICIÓN LOCAL DE TEXTOS (TEXTS)
 * Estructura limpia para desarrollo directo sin i18n, preparada para
 * extracción automatizada de traducciones cuando sea necesario.
 * =========================================================================
 */
export const TEXTS = {
  email: {
    label: { key: "field.email.label", default: "Correo electrónico" },
    placeholder: { key: "field.email.placeholder", default: "tucorreo@ejemplo.com" },
    required: { key: "field.email.required", default: "Ingresa tu correo electrónico" },
    invalid: { key: "field.email.invalid", default: "Correo electrónico inválido" },
  },
  password: {
    label: { key: "field.password.label", default: "Contraseña" },
    placeholder: { key: "field.password.placeholder", default: "••••••••" },
    required: { key: "field.password.required", default: "Ingresa tu contraseña" },
    min: { key: "field.password.min", default: "La contraseña debe tener al menos {min} caracteres" },
  },
  name: {
    label: { key: "field.name.label", default: "Nombre completo" },
    placeholder: { key: "field.name.placeholder", default: "Juan Pérez" },
    required: { key: "field.name.required", default: "Ingresa tu nombre" },
  },
};

export interface FieldOptions {
  label: FieldText;
  name: string;
  inputType?: string;
  placeholder?: FieldText;
  hint?: FieldText;
  disabled?: boolean | State<boolean>;
}

export interface Field {
  readonly name: string;
  readonly value: State<string>;
  readonly error: State<string>;
  readonly isTouched: State<boolean>;
  readonly isValid: State<boolean>;
  readonly isInvalid: State<boolean>;
  readonly stateClass: State<string>;
  addValidator(validator: Validator): Field;
  validate(valueOrData?: string | Record<string, unknown>, data?: Record<string, unknown>): boolean;
  dom(): HTMLElement;
  setError(msg: string): void;
  clearError(): void;
}

export const Field = (
  options: FieldOptions,
  initialValidators: Validator[] = [],
): Field => {
  const { div, label, input, p } = van.tags;
  const value = van.state("");
  const error = van.state("");
  const isTouched = van.state(false);
  const validators = [...initialValidators];

  const isValid = van.derive(() => !error.val && value.val.length > 0);
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
    let valToTest = value.val;
    let contextData = data;

    if (typeof valueOrData === "string") {
      valToTest = valueOrData;
      value.val = valueOrData;
    } else if (valueOrData && typeof valueOrData === "object") {
      contextData = valueOrData;
      if (valueOrData[options.name] !== undefined) {
        valToTest = String(valueOrData[options.name]);
        value.val = valToTest;
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

  const field: Field = {
    name: options.name,
    value,
    error,
    isTouched,
    isValid,
    isInvalid,
    stateClass,
    addValidator(validator: Validator) {
      validators.push(validator);
      return field;
    },
    validate,
    setError(msg: string) {
      error.val = msg;
      isTouched.val = true;
    },
    clearError() {
      error.val = "";
    },
    dom() {
      const inputClass = van.derive(
        () =>
          `w-full px-3 py-2 border rounded-md text-sm transition-colors focus:outline-none focus:ring-2 ${
            isInvalid.val
              ? "border-destructive focus:ring-destructive/30"
              : "border-border focus:ring-accent/30 focus:border-accent"
          }`,
      );

      const errorText = van.derive(() => (isInvalid.val || (isTouched.val && !!error.val)) ? error.val : "");

      return div(
        { class: () => `field flex flex-col gap-1 text-sm font-sans ${stateClass.val}` },
        label(
          { class: "font-medium text-foreground", for: options.name },
          options.label,
        ),
        input({
          id: options.name,
          name: options.name,
          type: options.inputType ?? "text",
          class: inputClass,
          value: () => value.val,
          placeholder: options.placeholder ?? "",
          disabled: options.disabled ?? false,
          oninput: (e: Event) => {
            value.val = (e.target as HTMLInputElement).value;
            if (isTouched.val) validate();
          },
          onblur: () => {
            isTouched.val = true;
            validate();
          },
        }),
        p(
          {
            class: () =>
              errorText.val
                ? "field-error text-xs text-destructive mt-0.5"
                : "hidden",
          },
          () => errorText.val,
        ),
        options.hint
          ? p({ class: "field-hint text-xs text-foreground-soft mt-0.5" }, options.hint)
          : null,
      );
    },
  };

  return field;
};

export interface TextFieldOptions {
  label?: FieldText;
  name?: string;
  placeholder?: FieldText;
  hint?: FieldText;
  required?: boolean;
  requiredMsg?: FieldText;
}

export interface EmailFieldOptions {
  label?: FieldText;
  name?: string;
  placeholder?: FieldText;
  hint?: FieldText;
  requiredMsg?: FieldText;
  invalidMsg?: FieldText;
}

export interface PasswordFieldOptions {
  label?: FieldText;
  name?: string;
  placeholder?: FieldText;
  hint?: FieldText;
  min?: number;
  requiredMsg?: FieldText;
  minMsg?: FieldText;
}

/** Campo requerido de texto libre. Baterías incluidas con i18n global. */
export function TextField(options?: TextFieldOptions): Field;
export function TextField(label?: string, name?: string, placeholder?: string): Field;
export function TextField(
  optionsOrLabel: string | TextFieldOptions = "text",
  name = "text",
  placeholder?: string,
): Field {
  if (typeof optionsOrLabel === "string") {
    return Field(
      { label: optionsOrLabel, name, inputType: "text", placeholder },
      [Required(t(TEXTS.name.required.key, undefined, TEXTS.name.required.default))],
    );
  }
  const {
    label = t(TEXTS.name.label.key, undefined, TEXTS.name.label.default),
    name: fieldName = "name",
    placeholder: ph = t(TEXTS.name.placeholder.key, undefined, TEXTS.name.placeholder.default),
    hint,
    required = true,
    requiredMsg = t(TEXTS.name.required.key, undefined, TEXTS.name.required.default),
  } = optionsOrLabel;
  const validators: Validator[] = [];
  if (required) {
    validators.push(Required(requiredMsg));
  }
  return Field({ label, name: fieldName, inputType: "text", placeholder: ph || undefined, hint }, validators);
}

/** Campo de correo: requerido + formato. Baterías incluidas con i18n global. */
export function EmailField(options?: EmailFieldOptions): Field;
export function EmailField(label?: string, name?: string, placeholder?: string): Field;
export function EmailField(
  optionsOrLabel: string | EmailFieldOptions = {},
  name = "email",
  placeholder?: string,
): Field {
  if (typeof optionsOrLabel === "string") {
    return Field(
      { label: optionsOrLabel, name, inputType: "email", placeholder: placeholder ?? TEXTS.email.placeholder.default },
      [
        Required(t(TEXTS.email.required.key, undefined, TEXTS.email.required.default)),
        Email(t(TEXTS.email.invalid.key, undefined, TEXTS.email.invalid.default)),
      ],
    );
  }
  const {
    label = t(TEXTS.email.label.key, undefined, TEXTS.email.label.default),
    name: fieldName = "email",
    placeholder: ph = t(TEXTS.email.placeholder.key, undefined, TEXTS.email.placeholder.default),
    hint,
    requiredMsg = t(TEXTS.email.required.key, undefined, TEXTS.email.required.default),
    invalidMsg = t(TEXTS.email.invalid.key, undefined, TEXTS.email.invalid.default),
  } = optionsOrLabel;

  return Field(
    { label, name: fieldName, inputType: "email", placeholder: ph || undefined, hint },
    [
      Required(requiredMsg),
      Email(invalidMsg),
    ],
  );
}

/** Campo de contraseña: requerido + largo mínimo. Baterías incluidas con i18n global. */
export function PasswordField(options?: PasswordFieldOptions): Field;
export function PasswordField(label?: string, name?: string, placeholder?: string, min?: number): Field;
export function PasswordField(
  optionsOrLabel: string | PasswordFieldOptions = {},
  name = "password",
  placeholder?: string,
  min = 6,
): Field {
  if (typeof optionsOrLabel === "string") {
    const minLength = min ?? 6;
    return Field(
      { label: optionsOrLabel, name, inputType: "password", placeholder: placeholder ?? TEXTS.password.placeholder.default },
      [
        Required(t(TEXTS.password.required.key, undefined, TEXTS.password.required.default)),
        MinLength(minLength, t(TEXTS.password.min.key, { min: minLength }, TEXTS.password.min.default)),
      ],
    );
  }
  const {
    label = t(TEXTS.password.label.key, undefined, TEXTS.password.label.default),
    name: fieldName = "password",
    placeholder: ph = t(TEXTS.password.placeholder.key, undefined, TEXTS.password.placeholder.default),
    hint,
    min: minLength = 6,
    requiredMsg = t(TEXTS.password.required.key, undefined, TEXTS.password.required.default),
    minMsg = t(TEXTS.password.min.key, { min: minLength }, TEXTS.password.min.default),
  } = optionsOrLabel;

  return Field(
    { label, name: fieldName, inputType: "password", placeholder: ph || undefined, hint },
    [
      Required(requiredMsg),
      MinLength(minLength, minMsg),
    ],
  );
}
