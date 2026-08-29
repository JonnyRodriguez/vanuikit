/**
 * Referencia — pantalla de registro de la librería (Form, Field, Button, Spin).
 *
 * Los campos (TextField, EmailField, PasswordField) vienen con baterías incluidas e i18n global.
 */
import van from "vanjs-core";
import { Form } from "../components/form.js";
import { TextField, EmailField, PasswordField } from "../components/field.js";
import { Button } from "../components/button.js";
import { Spin } from "../components/spin.js";
import { Match } from "../validators.js";
import { t } from "../i18n.js";

export type AuthResult = { error: string } | { ok?: boolean } | {};

/**
 * =========================================================================
 * DEFINICIÓN LOCAL DE TEXTOS (TEXTS)
 * =========================================================================
 */
export const TEXTS = {
  submit: { key: "register.submit", default: "Crear cuenta" },
  loading: { key: "register.loading", default: "Creando cuenta..." },
  confirm: {
    label: { key: "field.confirm.label", default: "Confirmar contraseña" },
    placeholder: { key: "field.confirm.placeholder", default: "••••••••" },
    required: { key: "field.confirm.required", default: "Confirma tu contraseña" },
    mismatch: { key: "field.confirm.mismatch", default: "Las contraseñas no coinciden" },
  },
};

/** Lo que RegisterForm necesita de su orquestador. */
export interface RegisterInfo {
  handleRegister: (data: Record<string, unknown>) => Promise<AuthResult>;
}

/**
 * Formulario de registro limpio.
 * Los campos ya traen sus etiquetas, placeholders y validaciones por defecto.
 */
export const RegisterForm = (info: RegisterInfo) => {
  const { div, p } = van.tags;

  const msg = van.state<Element | null>(null);
  const formError = van.state("");

  const form = Form(async (data) => {
    formError.val = "";
    msg.val = Spin(t(TEXTS.loading.key, undefined, TEXTS.loading.default));
    const result = await info.handleRegister(data);
    if ("error" in result && result.error) {
      formError.val = result.error as string;
      msg.val = null;
    }
  });

  const name = TextField({ name: "name" });
  const email = EmailField();
  const password = PasswordField();
  const confirm = PasswordField({
    name: "confirm",
    label: t(TEXTS.confirm.label.key, undefined, TEXTS.confirm.label.default),
    placeholder: t(TEXTS.confirm.placeholder.key, undefined, TEXTS.confirm.placeholder.default),
    requiredMsg: t(TEXTS.confirm.required.key, undefined, TEXTS.confirm.required.default),
  }).addValidator(Match("password", t(TEXTS.confirm.mismatch.key, undefined, TEXTS.confirm.mismatch.default)));

  form.add(name, email, password, confirm);

  return div(
    {},
    () =>
      formError.val
        ? p({ class: "text-destructive text-sm mb-3" }, formError.val)
        : "",
    form.dom(
      div(
        { class: "pt-2" },
        () =>
          (msg.val && msg.val) ||
          Button({ type: "submit" }, t(TEXTS.submit.key, undefined, TEXTS.submit.default)),
      ),
    ),
  );
};
