/**
 * Referencia — pantalla de login de la librería (Form, Field, Button, Spin).
 *
 * Los campos (EmailField, PasswordField) son autosuficientes con i18n global.
 * Si se desea personalizar textos o claves, se pueden pasar como opciones,
 * o cambiar directamente las traducciones en el singleton de i18n.
 */
import van from "vanjs-core";
import { Form } from "../components/form.js";
import { EmailField, PasswordField } from "../components/field.js";
import { Button } from "../components/button.js";
import { Spin } from "../components/spin.js";
import { t } from "../i18n.js";

export type AuthResult = { error: string } | { ok?: boolean } | {};

/** Lo que LoginForm necesita de su orquestador. */
export interface LoginInfo {
  handleLogin: (data: Record<string, unknown>) => Promise<AuthResult>;
}

/**
 * Formulario de login limpio y directo.
 * Los campos resuelven sus etiquetas, placeholders y validaciones automáticamente.
 */
export const LoginForm = (info: LoginInfo) => {
  const { div, p } = van.tags;

  const msg = van.state<Element | null>(null);
  const formError = van.state("");

  const form = Form(async (data) => {
    formError.val = "";
    msg.val = Spin(t("login.loading", "Iniciando sesión..."));
    const result = await info.handleLogin(data);
    if ("error" in result && result.error) {
      formError.val = result.error as string;
      msg.val = null;
    }
  });

  const email = EmailField();
  const password = PasswordField();

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
        () => (msg.val && msg.val) || Button({ type: "submit" }, t("login.submit", "Iniciar sesión")),
      ),
    ),
  );
};
