/**
 * LoginScreen — pantalla de login para la SPA.
 *
 * Patrón store/web: componente (función) con estado local reactivo
 * (error, loading). Reúne los datos del formulario con FormData, valida
 * cliente (email/password) y POSTea a /api/auth/login.
 *
 * Si el login falla, muestra el error. Si tiene éxito, navega a /gateways.
 */
import { van } from "vanui";
import { LoginForm } from "vanui";
import type { Router } from "vanui";

export type LoginScreenProps = {
  router: Router;
};

export const LoginScreen = ({ router }: LoginScreenProps) => {
  const { div } = van.tags;

  return div(
    { class: "page max-w-md mx-auto" },
    LoginForm({
      handleLogin: async (data) => {
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });

          const result = await res.json();
          if (result.error) {
            return { error: result.error };
          }
          router.navigate("/gateways");
          return {};
        } catch {
          return { error: "Error de conexión, intenta de nuevo" };
        }
      },
    }),
  );
};
