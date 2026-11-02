/**
 * Reference — library login screen (Form, Field, Button, Spin).
 *
 * The fields (EmailField, PasswordField) are self-sufficient with the global i18n.
 * To customize texts or keys, they can be passed as options,
 * or the translations changed directly on the i18n singleton.
 */
import van from "vanjs-core";
import { Form } from "../components/form.js";
import { EmailField, PasswordField } from "../components/field.js";
import { Button } from "../components/button.js";
import { Spin } from "../components/spin.js";
import { t } from "../i18n.js";

export type AuthResult = { error: string } | { ok?: boolean } | {};

/** What LoginForm needs from its orchestrator. */
export interface LoginInfo {
  handleLogin: (data: Record<string, unknown>) => Promise<AuthResult>;
}

/**
 * Clean, straightforward login form.
 * Fields resolve their labels, placeholders and validations automatically.
 * Uses the Form v3 contract: submitting, general error line and no double submit.
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
      msg.val = Spin(t("login.loading", "Signing in..."));
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
            t("login.submit", "Sign In"),
          ),
      ),
    ),
  );
};
