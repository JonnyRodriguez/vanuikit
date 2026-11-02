/**
 * Reference — library registration screen (Form, Field, Button, Spin).
 *
 * The fields (TextField, EmailField, PasswordField) come with batteries included and global i18n.
 */
import van from "vanjs-core";
import { Form } from "../components/form.js";
import { TextField, EmailField, PasswordField } from "../components/field.js";
import { Button } from "../components/button.js";
import { Spin } from "../components/spin.js";
import { Match } from "../validators.js";
import { t } from "../i18n.js";

export type AuthResult = { error: string } | { ok?: boolean } | {};

/** What RegisterForm needs from its orchestrator. */
export interface RegisterInfo {
  handleRegister: (data: Record<string, unknown>) => Promise<AuthResult>;
}

/**
 * Clean registration form.
 * Fields already ship their default labels, placeholders and validations.
 * Uses the Form v3 contract: submitting, general error line and no double submit.
 */
export const RegisterForm = (info: RegisterInfo) => {
  const { div, p } = van.tags;

  const msg = van.state<Element | null>(null);

  const form = Form({
    onSubmit: async (data) => {
      const result = await info.handleRegister(data);
      if (result && "error" in result && result.error) {
        return { ok: false, error: result.error as string };
      }
      return { ok: true };
    },
    onBeforeSubmit: () => {
      msg.val = Spin(t("register.loading", "Creating account..."));
    },
    onError: () => {
      msg.val = null;
    },
    onSuccess: () => {
      msg.val = null;
    },
  });

  const name = TextField({ name: "name" });
  const email = EmailField();
  const password = PasswordField();
  const confirm = PasswordField({
    name: "confirm",
    label: t("field.confirm.label", "Confirm password"),
    placeholder: t("field.confirm.placeholder", "••••••••"),
    requiredMsg: t("field.confirm.required", "Please confirm your password"),
  }).addValidator(Match("password", t("field.confirm.mismatch", "Passwords do not match")));

  form.add(name, email, password, confirm);

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
            t("register.submit", "Create Account"),
          ),
      ),
    ),
  );
};
