/**
 * Referencia — pantalla de registro de la librería (Form, Field, Button, Spin).
 *
 * Misma convención que LoginForm: los textos se declaran en un único array de
 * descriptores (`TEXTS`). Con `i18n` presente se resuelven desde el diccionario
 * (claves `auth.*` y `register.*`), con `t()` reactivo para etiquetas/
  * placeholders/botón y `raw()` para validación/spinner. Sin `i18n`, usa los
 * defaults en inglés (más universal). Extender = añadir una línea a `TEXTS`.
 */
import van from "vanjs-core";
import { Form } from "../components/form.js";
import { Field } from "../components/field.js";
import { Button } from "../components/button.js";
import { Spin } from "../components/spin.js";
import { Required, Email, MinLength, Match } from "../validators.js";
import { makeFormTexts } from "../i18n.js";
import type { I18nInstance } from "../i18n.js";

export type AuthResult = { error: string } | {};

const TEXTS = [
  { name: "nameLabel", key: "register.nameLabel", default: "Name" },
  { name: "namePlaceholder", key: "register.namePlaceholder", default: "Your name" },
  { name: "emailLabel", key: "auth.emailLabel", default: "Email" },
  { name: "emailPlaceholder", key: "auth.emailPlaceholder", default: "you@example.com" },
  { name: "passwordLabel", key: "auth.passwordLabel", default: "Password" },
  { name: "confirmLabel", key: "auth.confirmLabel", default: "Confirm password" },
  { name: "submit", key: "register.submit", default: "Create Account" },
  { name: "loading", key: "register.loading", default: "Creating account...", raw: true },
  { name: "nameRequired", key: "register.nameRequired", default: "Please enter your name", raw: true },
  { name: "emailRequired", key: "auth.emailRequired", default: "Please enter your email", raw: true },
  { name: "emailInvalid", key: "auth.emailInvalid", default: "Invalid email address", raw: true },
  { name: "passwordRequired", key: "auth.passwordRequired", default: "Please enter your password", raw: true },
  { name: "passwordMin", key: "auth.passwordMin", default: "Must be at least {min} characters", raw: true, params: { min: 6 } },
  { name: "confirmRequired", key: "auth.confirmRequired", default: "Please confirm your password", raw: true },
  { name: "passwordMismatch", key: "auth.passwordMismatch", default: "Passwords do not match", raw: true },
] as const;

/** Lo que RegisterForm necesita de su orquestador. */
export interface RegisterInfo {
  handleRegister: (data: Record<string, unknown>) => Promise<AuthResult>;
  i18n?: I18nInstance;
}

/**
 * Formulario de registro. `info` implementa info.handleRegister(data), que
 * devuelve {} si se creó la cuenta o { error } si falló.
 * Cada campo trae su validación: requerido, email (formato), contraseña
 * (mínimo) y confirmar (Match contra password).
 */
export const RegisterForm = (info: RegisterInfo) => {
  const { div, p } = van.tags;
  const texts = makeFormTexts(TEXTS, info.i18n);

  const msg = van.state<Element | null>(null);
  const formError = van.state("");

  const form = Form(async (data) => {
    formError.val = "";
    msg.val = Spin(texts.loading);
    const result = await info.handleRegister(data);
    if ("error" in result) {
      formError.val = result.error;
      msg.val = null;
    }
  });

  const name = Field({
    label: texts.nameLabel,
    name: "name",
    inputType: "text",
    placeholder: texts.namePlaceholder,
  });
  name.addValidator(Required(texts.nameRequired));

  const email = Field({
    label: texts.emailLabel,
    name: "email",
    inputType: "email",
    placeholder: texts.emailPlaceholder,
  });
  email.addValidator(Required(texts.emailRequired));
  email.addValidator(Email(texts.emailInvalid));

  const password = Field({
    label: texts.passwordLabel,
    name: "password",
    inputType: "password",
  });
  password.addValidator(Required(texts.passwordRequired));
  password.addValidator(MinLength(6, texts.passwordMin));

  const confirm = Field({
    label: texts.confirmLabel,
    name: "confirm",
    inputType: "password",
  });
  confirm.addValidator(Required(texts.confirmRequired));
  confirm.addValidator(Match("password", texts.passwordMismatch));

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
        () => (msg.val && msg.val) || Button({ type: "submit" }, texts.submit),
      ),
    ),
  );
};
