/**
 * App — orquestador de la SPA de demostración de VanUI.
 *
 * Configura:
 * - Rutas con guards de autenticación (`requireAuth`)
 * - Estado de autenticación (`createAuth`)
 * - Vista principal montada con Router
 */
import { van, createAuth, requireAuth, Router } from "vanui";
import { Header } from "./components/header.component.js";
import { LoginPage } from "./pages/login.page.js";
import { RegisterPage } from "./pages/register.page.js";
import { GatewaysPage } from "./pages/gateways.page.js";
import { ComponentsPage } from "./pages/components.page.js";

// Estado de sesión
export const authState = createAuth({
  me: async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) return { user: null };
      const data = await res.json();
      return { user: data.user || null };
    } catch {
      return { user: null };
    }
  },
  login: async (email, password) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Error al iniciar sesión");
    }
    const data = await res.json();
    return { user: data.user };
  },
  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {}
  },
});

export function App() {
  const router = new Router();

  router
    .add("/login", () => LoginPage({ router }))
    .add("/register", () => RegisterPage({ router }))
    .add("/gateways", () => GatewaysPage({ router }), {
      beforeEnter: requireAuth(authState, "/login"),
    })
    .add("/components", () => ComponentsPage({ router }))
    .redirect("/", "/gateways");

  void authState.boot().then(() => {
    router.resolve();
  });

  const { div } = van.tags;
  return div(
    { class: "min-h-screen bg-background text-foreground flex flex-col font-sans" },
    () => Header(router.path.val),
    div({ class: "flex-1 max-w-5xl w-full mx-auto px-4 py-4" }, router.start()),
  );
}
