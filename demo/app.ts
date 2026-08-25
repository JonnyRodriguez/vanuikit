// demo/app.ts
/**
 * App — Raíz de la SPA demo.
 *
 * Patrón store/web: Router de vanui + páginas declarativas (*.page.ts)
 * y componentes reutilizables (*.component.ts).
 */
import { van, Nav, Router } from "vanui";
import { ***REMOVED***Page } from "./pages/***REMOVED***.page.js";
import { LoginPage } from "./pages/login.page.js";
import { RegisterPage } from "./pages/register.page.js";
import { ComponentsPage } from "./pages/components.page.js";
import type { AuthUser } from "./shared/auth.schema.js";

const { div, h1, span, button } = van.tags;
export const router = new Router();

// Estado global reactivo del usuario autenticado
export const authState = {
  user: van.state<AuthUser | null>(null),
  async checkSession() {
    try {
      const token = typeof localStorage !== "undefined" ? localStorage.getItem("session_token") : null;
      const res = await fetch("/api/auth/me", {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        authState.user.val = json.data?.user || null;
      } else {
        authState.user.val = null;
      }
    } catch {
      authState.user.val = null;
    }
  },
  async logout() {
    try {
      const token = typeof localStorage !== "undefined" ? localStorage.getItem("session_token") : null;
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } finally {
      if (typeof localStorage !== "undefined") {
        try {
          localStorage.removeItem("session_token");
        } catch {}
      }
      authState.user.val = null;
      router.navigate("/login");
    }
  },
};

// ---------------------------------------------------------------------------
// Navegación compartida
// ---------------------------------------------------------------------------
export const NAV_LINKS = [
  { href: "/***REMOVED***", label: "***REMOVED***" },
  { href: "/login", label: "Login" },
  { href: "/register", label: "Registro" },
  { href: "/components", label: "Componentes" },
];

// ---------------------------------------------------------------------------
// Registro de rutas (pages)
// ---------------------------------------------------------------------------
function registerRoutes() {
  router
    .redirect("/", "/***REMOVED***")
    .add("/***REMOVED***", () => ***REMOVED***Page({ router }))
    .add("/login", () => LoginPage({ router }))
    .add("/register", () => RegisterPage({ router }))
    .add("/components", () => ComponentsPage())
    .setNotFound(
      () =>
        div(
          { class: "text-center p-8" },
          van.tags.h2({ class: "text-xl font-bold mb-2" }, "404"),
          van.tags.p({ class: "text-muted" }, "Página no encontrada"),
        ),
    );
}

// ---------------------------------------------------------------------------
// App — Shell principal
// ---------------------------------------------------------------------------
export const App = () => {
  registerRoutes();
  // Verificar sesión al montar la app
  authState.checkSession();

  return div(
    { class: "app-shell" },
    div(
      { class: "flex items-center justify-between px-4 py-2 border-b border-border mb-4" },
      h1({ class: "demo-title text-xl font-bold text-primary m-0" }, "VanUI — Demo"),
      () =>
        authState.user.val
          ? div(
              { class: "flex items-center gap-3 text-xs" },
              span(
                { class: "text-muted" },
                "Hola, ",
                span({ class: "font-semibold text-foreground" }, authState.user.val.name),
              ),
              button(
                {
                  class:
                    "px-2.5 py-1 text-destructive border border-destructive/30 rounded hover:bg-destructive/10 transition cursor-pointer font-medium",
                  onclick: () => authState.logout(),
                },
                "Cerrar sesión",
              ),
            )
          : div(),
    ),
    () => Nav(NAV_LINKS, { current: router.path.val }),
    router.start(),
  );
};
