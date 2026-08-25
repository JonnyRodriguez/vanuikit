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

export type RegisterPageProps = {
  router: Router;
};

export const RegisterPage = ({ router }: RegisterPageProps) => {
  const { div } = van.tags;

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
    { class: "page max-w-md mx-auto" },
    RegisterForm({
      handleRegister: async (data) => {
        const result = await registerMutation.mutate(data as RegisterInput);
        if (!result) {
          return { error: registerMutation.error.val || "Error al crear cuenta" };
        }
        return {};
      },
    }),
  );
};
