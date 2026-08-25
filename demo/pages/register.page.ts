// demo/pages/register.page.ts
/**
 * RegisterPage — Vista de registro de usuario de la SPA.
 *
 * Utiliza createMutation de vanui para enviar el formulario a /api/auth/register
 * de forma reactiva y limpia.
 */
import { van, RegisterForm, createMutation, type Router } from "vanui";
import type { RegisterInput, AuthResponse } from "../shared/auth.schema.js";
import { authState } from "../app.js";
import { i18n } from "../shared/i18n.config.js";

export type RegisterPageProps = {
  router: Router;
};

export const RegisterPage = ({ router }: RegisterPageProps) => {
  const { div, h1, p, a } = van.tags;

  const registerMutation = createMutation<{ status: string; data: AuthResponse }, RegisterInput>(
    "/api/auth/register",
    {
      onSuccess: (res) => {
        if (res.data?.user) {
          authState.user.val = res.data.user;
          if (res.data.token) {
            try {
              localStorage.setItem("session_token", res.data.token);
            } catch {}
          }
        }
        router.navigate("/***REMOVED***");
      },
    },
  );

  return div(
    { class: "max-w-md mx-auto my-8 p-6 bg-background rounded-xl border border-border shadow-sm" },
    h1({ class: "text-2xl font-bold text-foreground text-center mb-1" }, i18n.t("register.title")),
    p({ class: "text-sm text-foreground-soft text-center mb-6" }, i18n.t("register.subtitle")),
    RegisterForm({
      handleRegister: async (data) => {
        const result = await registerMutation.mutate(data as RegisterInput);
        if (!result) {
          return { error: i18n.raw("register.errGeneric") };
        }
        return {};
      },
      i18n,
    }),
    div(
      { class: "mt-6 text-center text-xs text-foreground-soft border-t border-border pt-4" },
      () => div({}, i18n.t("register.haveAccount"), " ",
        a(
          {
            href: "/login",
            class: "text-accent hover:underline font-medium cursor-pointer",
            onclick: (e: MouseEvent) => {
              e.preventDefault();
              router.navigate("/login");
            },
          },
          i18n.t("register.loginLink"),
        ),
      ),
    ),
  );
};
