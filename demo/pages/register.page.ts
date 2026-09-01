// demo/pages/register.page.ts
/**
 * RegisterPage — Vista de registro de usuario de la SPA.
 *
 * Utiliza el componente embebido RegisterForm y delega la creación de cuenta
 * y persistencia completamente en authState.
 */
import { van, RegisterForm, Link, navigate } from "vanui";
import { authState } from "../app.js";
import { i18n } from "../shared/i18n.config.js";

export const TEXTS = {
  title: { key: "register.title", default: "Crear una cuenta" },
  subtitle: { key: "register.subtitle", default: "Ingresa tus datos para comenzar a operar" },
  haveAccount: { key: "register.haveAccount", default: "¿Ya tienes cuenta?" },
  loginLink: { key: "register.loginLink", default: "Inicia sesión" },
  errGeneric: { key: "register.errGeneric", default: "Error al registrarse. Intenta nuevamente." },
};

export const RegisterPage = () => {
  const { div, h1, p } = van.tags;

  return div(
    { class: "max-w-md mx-auto my-8 p-6 bg-background rounded-xl border border-border shadow-sm" },
    h1({ class: "text-2xl font-bold text-foreground text-center mb-1" }, i18n.t(TEXTS.title.key, undefined, TEXTS.title.default)),
    p({ class: "text-sm text-foreground-soft text-center mb-6" }, i18n.t(TEXTS.subtitle.key, undefined, TEXTS.subtitle.default)),
    RegisterForm({
      handleRegister: async (data) => {
        try {
          await authState.register(data);
          navigate("/***REMOVED***");
          return {};
        } catch (err: any) {
          return { error: err.message || i18n.raw(TEXTS.errGeneric.key, undefined, TEXTS.errGeneric.default) };
        }
      },
    }),
    div(
      { class: "mt-6 text-center text-xs text-foreground-soft border-t border-border pt-4" },
      i18n.t(TEXTS.haveAccount.key, undefined, TEXTS.haveAccount.default),
      " ",
      Link({ href: "/login" }, i18n.t(TEXTS.loginLink.key, undefined, TEXTS.loginLink.default)),
    ),
  );
};
