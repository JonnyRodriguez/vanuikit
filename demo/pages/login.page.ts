// demo/pages/login.page.ts
/**
 * LoginPage — Vista de inicio de sesión de la SPA.
 *
 * Utiliza createMutation de vanui para enviar las credenciales a /api/auth/login
 * de forma reactiva y limpia.
 */
import { van, LoginForm, createMutation, type Router } from "vanui";
import type { LoginInput, AuthResponse } from "../shared/auth.schema.js";
import { authState } from "../app.js";

export type LoginPageProps = {
  router: Router;
};

export const LoginPage = ({ router }: LoginPageProps) => {
  const { div, h1, p, a } = van.tags;

  const loginMutation = createMutation<{ status: string; data: AuthResponse }, LoginInput>(
    "/api/auth/login",
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
        // Redirigir inmediatamente a /***REMOVED***
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTo = urlParams.get("redirect") || "/***REMOVED***";
        router.navigate(redirectTo);
      },
    },
  );

  return div(
    { class: "max-w-md mx-auto my-8 p-6 bg-background rounded-xl border border-border shadow-sm" },
    h1({ class: "text-2xl font-bold text-foreground text-center mb-1" }, "Iniciar Sesión"),
    p({ class: "text-sm text-foreground-soft text-center mb-6" }, "Ingresa con tus credenciales"),
    LoginForm({
      handleLogin: async (data) => {
        const result = await loginMutation.mutate(data as LoginInput);
        if (!result) {
          return { error: loginMutation.error.val || "Error al iniciar sesión" };
        }
        return {};
      },
    }),
    div(
      { class: "mt-6 text-center text-xs text-foreground-soft border-t border-border pt-4" },
      "¿No tienes cuenta? ",
      a(
        {
          href: "/register",
          class: "text-accent hover:underline font-medium cursor-pointer",
          onclick: (e: MouseEvent) => {
            e.preventDefault();
            router.navigate("/register");
          },
        },
        "Regístrate aquí",
      ),
    ),
  );
};
