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
  const { div } = van.tags;

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
        // Redirigir inmediatamente a /gateways
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTo = urlParams.get("redirect") || "/gateways";
        router.navigate(redirectTo);
      },
    },
  );

  return div(
    { class: "page max-w-md mx-auto" },
    LoginForm({
      handleLogin: async (data) => {
        const result = await loginMutation.mutate(data as LoginInput);
        if (!result) {
          return { error: loginMutation.error.val || "Error al iniciar sesión" };
        }
        return {};
      },
    }),
  );
};
