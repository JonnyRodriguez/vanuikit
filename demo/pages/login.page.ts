// demo/pages/login.page.ts
/**
 * LoginPage — Vista de inicio de sesión de la SPA.
 *
 * Utiliza el componente embebido LoginForm y delega la autenticación
 * y persistencia completamente en authState.
 */
import { van, LoginForm, Link, navigate } from "vanui";
import { authState } from "../app.js";
import { i18n } from "../shared/i18n.config.js";

export const LoginPage = () => {
  const { div, h1, p } = van.tags;

  const urlParams = new URLSearchParams(window.location.search);
  const redirectTo = urlParams.get("redirect") || "/***REMOVED***";

  return div(
    { class: "max-w-md mx-auto my-8 p-6 bg-background rounded-xl border border-border shadow-sm" },
    h1({ class: "text-2xl font-bold text-foreground text-center mb-1" }, i18n.t("login.title", "Iniciar sesión")),
    p({ class: "text-sm text-foreground-soft text-center mb-6" }, i18n.t("login.subtitle", "Ingresa a tu cuenta para gestionar tus ***REMOVED***s")),
    LoginForm({
      handleLogin: async ({ email, password }) => {
        try {
          await authState.login(email as string, password as string);
          navigate(redirectTo);
          return {};
        } catch (err: any) {
          return { error: err.message || i18n.raw("login.errGeneric", "Error al iniciar sesión. Revisa tus credenciales.") };
        }
      },
    }),
    div(
      { class: "mt-6 text-center text-xs text-foreground-soft border-t border-border pt-4" },
      i18n.t("login.noAccount", "¿No tienes una cuenta?"),
      " ",
      Link({ href: "/register" }, i18n.t("login.signupLink", "Regístrate aquí")),
    ),
  );
};
