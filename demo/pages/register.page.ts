// demo/pages/register.page.ts
/**
 * RegisterPage — Vista de registro de usuario de la SPA.
 *
 * Utiliza el componente embebido RegisterForm y delega la creación de cuenta
 * y persistencia completamente en authState.
 */
import { van, RegisterForm, Link, navigate } from "vanuikit";
import { authState } from "../app.js";
import { i18n } from "../shared/i18n.config.js";

export const RegisterPage = () => {
  const { div, h1, p } = van.tags;

  return div(
    { class: "max-w-md mx-auto my-8 p-6 bg-background rounded-xl border border-border shadow-sm" },
    h1({ class: "text-2xl font-bold text-foreground text-center mb-1" }, i18n.t("register.title", "Crear una cuenta")),
    p({ class: "text-sm text-foreground-soft text-center mb-6" }, i18n.t("register.subtitle", "Ingresa tus datos para comenzar a operar")),
    RegisterForm({
      handleRegister: async (data) => {
        try {
          await authState.register(data);
          navigate("/***REMOVED***");
          return {};
        } catch (err: any) {
          return { error: err.message || i18n.raw("register.errGeneric", "Error al registrarse. Intenta nuevamente.") };
        }
      },
    }),
    div(
      { class: "mt-6 text-center text-xs text-foreground-soft border-t border-border pt-4" },
      i18n.t("register.haveAccount", "¿Ya tienes cuenta?"),
      " ",
      Link({ href: "/login" }, i18n.t("register.loginLink", "Inicia sesión")),
    ),
  );
};
