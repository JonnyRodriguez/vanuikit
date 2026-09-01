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

export const TEXTS = {
  title: { key: "login.title", default: "Iniciar sesión" },
  subtitle: { key: "login.subtitle", default: "Ingresa a tu cuenta para gestionar tus pasarelas" },
  noAccount: { key: "login.noAccount", default: "¿No tienes una cuenta?" },
  signupLink: { key: "login.signupLink", default: "Regístrate aquí" },
  errGeneric: { key: "login.errGeneric", default: "Error al iniciar sesión. Revisa tus credenciales." },
};

export const LoginPage = () => {
  const { div, h1, p } = van.tags;

  const urlParams = new URLSearchParams(window.location.search);
  const redirectTo = urlParams.get("redirect") || "/gateways";

  return div(
    { class: "max-w-md mx-auto my-8 p-6 bg-background rounded-xl border border-border shadow-sm" },
    h1({ class: "text-2xl font-bold text-foreground text-center mb-1" }, i18n.t(TEXTS.title.key, undefined, TEXTS.title.default)),
    p({ class: "text-sm text-foreground-soft text-center mb-6" }, i18n.t(TEXTS.subtitle.key, undefined, TEXTS.subtitle.default)),
    LoginForm({
      handleLogin: async ({ email, password }) => {
        try {
          await authState.login(email as string, password as string);
          navigate(redirectTo);
          return {};
        } catch (err: any) {
          return { error: err.message || i18n.raw(TEXTS.errGeneric.key, undefined, TEXTS.errGeneric.default) };
        }
      },
    }),
    div(
      { class: "mt-6 text-center text-xs text-foreground-soft border-t border-border pt-4" },
      i18n.t(TEXTS.noAccount.key, undefined, TEXTS.noAccount.default),
      " ",
      Link({ href: "/register" }, i18n.t(TEXTS.signupLink.key, undefined, TEXTS.signupLink.default)),
    ),
  );
};
