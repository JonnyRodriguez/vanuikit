/**
 * Referencia — pantalla de login construida con los componentes de la
 * librería (Form, Field, Button, Spin).
 */
import van from "vanjs-core";
import { Form } from "../components/form.js";
import { EmailField, PasswordField } from "../components/field.js";
import { Button } from "../components/button.js";
import { Spin } from "../components/spin.js";

export type AuthResult = { error: string } | {};

/** Lo que LoginForm necesita de su orquestador. */
export interface LoginInfo {
  handleLogin: (data: Record<string, unknown>) => Promise<AuthResult>;
}

/**
 * Formulario de login. `info` implementa info.handleLogin(data), que
 * devuelve {} si las credenciales son válidas o { error } si no.
 * La validación de email y contraseña la hacen los propios campos
 * (EmailField, PasswordField) — aquí no se repite.
 */
export const LoginForm = (info: LoginInfo) => {
  const { div, p } = van.tags;

  const msg = van.state<Element | null>(null);
  const formError = van.state("");

  const form = Form(async (data) => {
    formError.val = "";
    msg.val = Spin("Iniciando sesión...");
    const result = await info.handleLogin(data);
    if ("error" in result) {
      formError.val = result.error;
      msg.val = null;
    }
  });

  form.add(EmailField(), PasswordField());

  return div(
    {},
    () =>
      formError.val
        ? p({ class: "text-destructive text-sm mb-3" }, formError.val)
        : "",
    form.dom(
      div(
        { class: "pt-2" },
        () => (msg.val && msg.val) || Button({ type: "submit" }, "Iniciar sesión"),
      ),
    ),
  );
};
