// demo/pages/login.page.ts
/**
 * LoginPage — Sign-in view of the SPA.
 *
 * Uses the embedded LoginForm component and delegates authentication
 * and persistence entirely to authState.
 */
import { van, LoginForm, Link, navigate } from "vanuikit";
import { authState } from "../app.js";
import { i18n } from "../shared/i18n.config.js";

export const LoginPage = () => {
  const { div, h1, p } = van.tags;

  const urlParams = new URLSearchParams(window.location.search);
  const redirectTo = urlParams.get("redirect") || "/dashboard";

  return div(
    { class: "max-w-md mx-auto my-8 p-6 bg-background rounded-xl border border-border shadow-sm" },
    h1({ class: "text-2xl font-bold text-foreground text-center mb-1" }, i18n.t("login.title", "Sign In")),
    p({ class: "text-sm text-foreground-soft text-center mb-6" }, i18n.t("login.subtitle", "Enter your credentials")),
    LoginForm({
      handleLogin: async ({ email, password }) => {
        try {
          await authState.login(email as string, password as string);
          navigate(redirectTo);
          return {};
        } catch (err: any) {
          return { error: err.message || i18n.raw("login.errGeneric", "Error signing in") };
        }
      },
    }),
    div(
      { class: "mt-6 text-center text-xs text-foreground-soft border-t border-border pt-4" },
      i18n.t("login.noAccount", "Don't have an account?"),
      " ",
      Link({ href: "/register" }, i18n.t("login.signupLink", "Sign up here")),
    ),
  );
};
