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
 * Usa el contrato de Form v3: submitting, línea general y sin doble submit.
 */
export const LoginForm = (info: LoginInfo) => {
  const { div, p } = van.tags;

  const msg = van.state<Element | null>(null);

  const form = Form({
    onSubmit: async (data) => {
      const result = await info.handleLogin(data);
      if (result && "error" in result && result.error) {
        return { ok: false, error: result.error as string };
      }
      return { ok: true };
    },
    onBeforeSubmit: () => {
      msg.val = Spin(t("login.loading", "Iniciando sesión..."));
    },
    onError: () => {
      msg.val = null;
    },
    onSuccess: () => {
      msg.val = null;
    },
  });

  const email = EmailField();
  const password = PasswordField();

  form.add(email, password);

  return div(
    {},
    () =>
      form.error.val
        ? p({ class: "text-destructive text-sm mb-3" }, form.error.val)
        : "",
    form.dom(
      div(
        { class: "pt-2" },
        () =>
          (msg.val && msg.val) ||
          Button(
            { type: "submit", disabled: form.submitting.val },
            t("login.submit", "Iniciar sesión"),
          ),
      ),
    ),
  );
};
