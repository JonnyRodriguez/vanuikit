/**
 * Referencia — pantalla de login de la librería (Form, Field, Button, Spin).
 *
 * Los textos se declaran en un único array de descriptores (`TEXTS`): cada
  * entrada tiene su llave de diccionario i18n y su default en inglés (más
 * universal). Con `i18n` presente, etiquetas/placeholders/botón se resuelven con `t()`
 * (reactivos, cambian en vivo) y los mensajes de validación/spinner con
 * `raw()` (entradas marcadas `raw: true`). Sin `i18n` usa los defaults.
 * Extender el formulario = añadir una línea a `TEXTS` y usarla.
 */
import van from "vanjs-core";
import { Form } from "../components/form.js";
import { Field } from "../components/field.js";
import { Button } from "../components/button.js";
import { Spin } from "../components/spin.js";
import { Required, Email } from "../validators.js";
import { makeFormTexts } from "../i18n.js";
import type { I18nInstance } from "../i18n.js";

export type AuthResult = { error: string } | {};

const TEXTS = [
  { name: "emailLabel", key: "auth.emailLabel", default: "Email" },
  { name: "emailPlaceholder", key: "auth.emailPlaceholder", default: "you@example.com" },
  { name: "passwordLabel", key: "auth.passwordLabel", default: "Password" },
  { name: "submit", key: "login.submit", default: "Sign In" },
  { name: "loading", key: "login.loading", default: "Signing in...", raw: true },
  { name: "emailRequired", key: "auth.emailRequired", default: "Please enter your email", raw: true },
  { name: "emailInvalid", key: "auth.emailInvalid", default: "Invalid email address", raw: true },
  { name: "passwordRequired", key: "auth.passwordRequired", default: "Please enter your password", raw: true },
] as const;

/** Lo que LoginForm necesita de su orquestador. */
export interface LoginInfo {
  handleLogin: (data: Record<string, unknown>) => Promise<AuthResult>;
  i18n?: I18nInstance;
}

/**
 * Formulario de login. `info` implementa info.handleLogin(data), que
 * devuelve {} si las credenciales son válidas o { error } si no.
 * La validación de email y contraseña la hacen los propios campos —
 * aquí no se repite.
 */
export const LoginForm = (info: LoginInfo) => {
  const { div, p } = van.tags;
  const texts = makeFormTexts(TEXTS, info.i18n);

  const msg = van.state<Element | null>(null);
  const formError = van.state("");

  const form = Form(async (data) => {
    formError.val = "";
    msg.val = Spin(texts.loading);
    const result = await info.handleLogin(data);
    if ("error" in result) {
      formError.val = result.error;
      msg.val = null;
    }
  });

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

  form.add(email, password);

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
