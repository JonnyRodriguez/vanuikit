/**
 * Referencia — pantalla de registro construida con los componentes de la
 * librería (Form, Field, Button, Spin).
 */
import van from "vanjs-core";
import { Form } from "../components/form.js";
import { TextField, EmailField, PasswordField } from "../components/field.js";
import { Button } from "../components/button.js";
import { Spin } from "../components/spin.js";
import { Match } from "../validators.js";

export type AuthResult = { error: string } | {};

/** Lo que RegisterForm necesita de su orquestador. */
export interface RegisterInfo {
  handleRegister: (data: Record<string, unknown>) => Promise<AuthResult>;
}

/**
 * Formulario de registro. `info` implementa info.handleRegister(data), que
 * devuelve {} si se creó la cuenta o { error } si falló.
 * Cada campo trae su validación: TextField (requerido), EmailField
 * (requerido + formato), PasswordField (requerido + mínimo), y el campo
 * confirmar agrega Match sin perder las del tipo.
 */
export const RegisterForm = (info: RegisterInfo) => {
  const { div, p } = van.tags;

  const msg = van.state<Element | null>(null);
  const formError = van.state("");

  const form = Form(async (data) => {
    formError.val = "";
    msg.val = Spin("Creando cuenta...");
    const result = await info.handleRegister(data);
    if ("error" in result) {
      formError.val = result.error;
      msg.val = null;
    }
  });

  const confirm = PasswordField("Confirmar contraseña", "confirm");
  confirm.addValidator(Match("password", "Las contraseñas no coinciden"));

  form.add(
    TextField("Nombre", "name", "Tu nombre"),
    EmailField(),
    PasswordField("Contraseña", "password"),
    confirm,
  );

  return div(
    {},
    () =>
      formError.val
        ? p({ class: "text-destructive text-sm mb-3" }, formError.val)
        : "",
    form.dom(
      div(
        { class: "pt-2" },
        () => (msg.val && msg.val) || Button({ type: "submit" }, "Crear cuenta"),
      ),
    ),
  );
};
