/**
 * RegisterScreen — pantalla de registro para la SPA.
 *
 * Patrón store/web: componente (función) con estado local reactivo.
 * Usa RegisterForm (valida cliente) y POSTea a /api/auth/register.
 * Si tiene éxito, navega a /login.
 */
import { van } from "vanui";
import { RegisterForm } from "vanui";
import type { Router } from "vanui";

export type RegisterScreenProps = {
  router: Router;
};

export const RegisterScreen = ({ router }: RegisterScreenProps) => {
  const { div } = van.tags;

  return div(
    { class: "page max-w-md mx-auto" },
    RegisterForm({
      handleRegister: async (data) => {
        try {
          const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });

          const result = await res.json();
          if (result.error) {
            return { error: result.error };
          }
          router.navigate("/login");
          return {};
        } catch {
          return { error: "Error de conexión, intenta de nuevo" };
        }
      },
    }),
  );
};
