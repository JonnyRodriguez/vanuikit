import van, {
  type ChildDom,
  type State,
  type PropValueOrDerived,
} from "vanjs-core";
import { cx } from "../util.js";
import { type Validator, Required, Email, MinLength } from "../validators.js";

const FORM_CONTROL_CLASSES =
  "text-base w-full p-2.5 border border-border rounded-md bg-background text-foreground" +
  " focus:outline-none focus:ring-2 focus:ring-focus focus:border-focus" +
  " transition duration-150 ease-in-out";

/** Texto de un control: string estático o State reactivo (para i18n). */
export type FieldText = string | State<string>;

/** Props passthrough de un control: atributos HTML válidos de VanJS. */
type FieldProps = { class?: string } & Record<string, PropValueOrDerived>;

/** Controles de formulario básicos. Todos fusionan props.class con sus clases. */
export const Input = (props: FieldProps = {}) => {
  const { class: extra, ...rest } = props;
  return van.tags.input({ ...rest, class: cx(FORM_CONTROL_CLASSES, extra) });
};

export const Select = (props: FieldProps = {}, ...children: ChildDom[]) => {
  const { class: extra, ...rest } = props;
  return van.tags.select(
    { ...rest, class: cx(FORM_CONTROL_CLASSES, extra) },
    ...children,
  );
};

export const Textarea = (props: FieldProps = {}) => {
  const { class: extra, ...rest } = props;
  return van.tags.textarea({ ...rest, class: cx(FORM_CONTROL_CLASSES, extra) });
};

const LABEL_CLASSES = "block mb-1 text-sm font-medium text-foreground-soft";

export const Label = (props: FieldProps = {}, ...children: ChildDom[]) => {
  const { class: extra, ...rest } = props;
  return van.tags.label(
    { ...rest, class: cx(LABEL_CLASSES, extra) },
    ...children,
  );
};

// ---------------------------------------------------------------
// Field — unidad: label + control + validación + error.
// Fábricas (mismo esquema que Button/Modal/Spin): el Field base
// recibe una config; los campos tipados lo envuelven y pre-registran
// sus validadores. Se amplía con addValidator sin perder los del tipo.
// ---------------------------------------------------------------

export type Field = {
  readonly name: string;
  /** Estado reactivo del error: lo puebla validate(), lo lee dom(). */
  readonly error: State<string>;
  /** Amplía la validación sin perder las del tipo (patrón proxy). */
  addValidator(v: Validator): Field;
  /** Corre los validadores; deja el primer error en el estado. */
  validate(value: string, data?: Record<string, unknown>): boolean;
  /** La unidad completa: label + control + error (y hint si hay). */
  dom(): ChildDom;
};

/** Config del Field base. `control` reemplaza el input (p. ej. un select). */
export type FieldConfig = {
  label: FieldText;
  name: string;
  inputType?: string;
  placeholder?: FieldText;
  hint?: FieldText;
  control?: () => ChildDom;
};

/** Field base — fábrica. Los campos tipados lo envuelven con validadores. */
export const Field = (
  { label, name, inputType = "text", placeholder, hint, control }: FieldConfig,
  validators: Validator[] = [],
): Field => {
  const error = van.state("");

  const field: Field = {
    name,
    error,
    addValidator(v) {
      validators.push(v);
      return field;
    },
    validate(value, data) {
      for (const v of validators) {
        const err = v.validate(value, data);
        if (err) {
          error.val = err;
          return false;
        }
      }
      error.val = "";
      return true;
    },
    dom() {
      const { div } = van.tags;
      return div(
        { class: "mb-4" },
        Label({}, label),
        control
          ? control()
          : Input({
              name,
              type: inputType,
              ...(placeholder ? { placeholder } : {}),
              required: true,
            }),
        () =>
          error.val
            ? div({ class: "text-destructive text-sm mt-1" }, error.val)
            : "",
        ...(hint
          ? [() => div({ class: "text-muted text-sm mt-1" }, hint)]
          : []),
      );
    },
  };

  return field;
};

/** Campo requerido de texto libre. */
export const TextField = (
  label: string,
  name: string,
  placeholder?: string,
): Field =>
  Field(
    { label, name, inputType: "text", placeholder },
    [Required("Ingresa tu " + label.toLowerCase())],
  );

/** Campo de correo: requerido + formato. */
export const EmailField = (
  label = "Correo electrónico",
  name = "email",
  placeholder = "tucorreo@ejemplo.com",
): Field =>
  Field(
    { label, name, inputType: "email", placeholder },
    [
      Required("Ingresa tu correo electrónico"),
      Email("Correo electrónico inválido"),
    ],
  );

/** Campo de contraseña: requerido + largo mínimo. */
export const PasswordField = (
  label = "Contraseña",
  name = "password",
  placeholder = "••••••••",
  min = 6,
): Field =>
  Field(
    { label, name, inputType: "password", placeholder },
    [
      Required("Ingresa tu contraseña"),
      MinLength(min, `Mínimo ${min} caracteres`),
    ],
  );
