/**
 * App — orquestador de la SPA de demostración de VanUI.
 *
 * Configura:
 * - Rutas con guards de autenticación (`requireAuth`)
 * - Estado de autenticación (`createAuth`)
 * - Layout Dashboard / AppShell responsive con Sidebar, HeaderBar y soporte Mobile-First
 */
import {
  van,
  createAuth,
  requireAuth,
  createRouter,
  AppShell,
  Sidebar,
  SidebarGroup,
  SidebarItem,
  HeaderBar,
  ThemeToggle,
  LocaleSelector,
  UserBadge,
  navigate,
} from "vanui";
import { LoginPage } from "./pages/login.page.js";
import { RegisterPage } from "./pages/register.page.js";
import { ***REMOVED***Page } from "./pages/***REMOVED***.page.js";
import { ComponentsPage } from "./pages/components.page.js";
import { i18n } from "./shared/i18n.config.js";
import { theme } from "./shared/theme.config.js";

/** Contrato de llaves de i18n para la navegación y títulos de la aplicación */
export const TEXTS = {
  nav: {
    ***REMOVED***: "nav.***REMOVED***",
    components: "nav.components",
    login: "nav.login",
    register: "nav.register",
  },
  titles: {
    ***REMOVED***: "***REMOVED***.title",
    components: "components.title",
    login: "login.title",
    register: "register.title",
  },
} as const;

// Estado de sesión
export const authState = createAuth({
  me: async () => {
    try {
      const headers: Record<string, string> = { Accept: "application/json" };
      let token: string | null = null;
      if (typeof localStorage !== "undefined") {
        token = localStorage.getItem("session_token");
        if (token) headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch("/api/auth/me", { credentials: "include", headers });
      if (!res.ok) {
        if (typeof localStorage !== "undefined") {
          localStorage.removeItem("session_token");
        }
        return { user: null };
      }
      const data = await res.json();
      const user = data.data?.user || data.user || null;
      return { user };
    } catch {
      return { user: null };
    }
  },
  login: async (email, password) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Error al iniciar sesión");
    }
    const data = await res.json();
    const user = data.data?.user || data.user;
    const token = data.data?.token || data.token;
    if (token && typeof localStorage !== "undefined") {
      localStorage.setItem("session_token", token);
    }
    return { user };
  },
  logout: async () => {
    try {
      const headers: Record<string, string> = {};
      if (typeof localStorage !== "undefined") {
        const token = localStorage.getItem("session_token");
        if (token) headers["Authorization"] = `Bearer ${token}`;
      }
      await fetch("/api/auth/logout", { method: "POST", credentials: "include", headers });
    } catch {}
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("session_token");
    }
  },
});

// Router Singleton de la aplicación
export const router = createRouter();

router
  .add("/login", () => LoginPage())
  .add("/register", () => RegisterPage())
  .add("/***REMOVED***", () => ***REMOVED***Page(), {
    beforeEnter: requireAuth(authState, "/login"),
  })
  .add("/components", () => ComponentsPage())
  .redirect("/", "/***REMOVED***");

export function App() {
  void authState.boot().then(() => {
    router.resolve();
  });

  const { span, a, button } = van.tags;
  const sidebarOpen = van.state(false);

  const getPageTitle = van.derive(() => {
    const p = router.path.val;
    if (p.startsWith("/***REMOVED***")) return i18n.t(TEXTS.titles.***REMOVED***, undefined, "***REMOVED***s de Transaction").val;
    if (p.startsWith("/components")) return i18n.t(TEXTS.titles.components, undefined, "Catálogo de Componentes").val;
    if (p.startsWith("/login")) return i18n.t(TEXTS.titles.login, undefined, "Iniciar Sesión").val;
    if (p.startsWith("/register")) return i18n.t(TEXTS.titles.register, undefined, "Crear Cuenta").val;
    return "Dashboard";
  });

  return AppShell({
    sidebarOpen,
    sidebar: Sidebar({
      onClose: () => {
        sidebarOpen.val = false;
      },
      header: a(
        {
          href: "/***REMOVED***",
          class: "flex items-center gap-2.5 font-bold text-foreground tracking-tight text-lg no-underline",
          onclick: (e: MouseEvent) => {
            e.preventDefault();
            sidebarOpen.val = false;
            navigate("/***REMOVED***");
          },
        },
        span({ class: "text-primary font-black text-xl" }, "VanUI"),
        span(
          {
            class:
              "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20",
          },
          "Dashboard",
        ),
      ),
      content: [
        SidebarGroup(
          { title: "Plataforma" },
          SidebarItem({
            href: "/***REMOVED***",
            label: i18n.t(TEXTS.nav.***REMOVED***),
            icon: "💳",
            current: router.path,
            onclick: (e) => {
              e.preventDefault();
              sidebarOpen.val = false;
              navigate("/***REMOVED***");
            },
          }),
          SidebarItem({
            href: "/components",
            label: i18n.t(TEXTS.nav.components),
            icon: "🧩",
            badge: "17",
            badgeVariant: "secondary",
            current: router.path,
            onclick: (e) => {
              e.preventDefault();
              sidebarOpen.val = false;
              navigate("/components");
            },
          }),
        ),
        () =>
          !authState.user.val
            ? SidebarGroup(
                { title: "Cuenta" },
                SidebarItem({
                  href: "/login",
                  label: i18n.t(TEXTS.nav.login),
                  icon: "🔑",
                  current: router.path,
                  onclick: (e) => {
                    e.preventDefault();
                    sidebarOpen.val = false;
                    navigate("/login");
                  },
                }),
                SidebarItem({
                  href: "/register",
                  label: i18n.t(TEXTS.nav.register, undefined, "Registro"),
                  icon: "📝",
                  current: router.path,
                  onclick: (e) => {
                    e.preventDefault();
                    sidebarOpen.val = false;
                    navigate("/register");
                  },
                }),
              )
            : null,
      ],
      // Pie de barra lateral usando componente embebido de usuario
      footer: UserBadge({
        auth: authState,
        i18n,
        onLogout: () => navigate("/login"),
      }),
    }),
    header: HeaderBar({
      leading: button(
        {
          type: "button",
          class:
            "lg:hidden p-2 rounded-lg text-foreground hover:bg-secondary border border-border cursor-pointer text-base flex items-center justify-center",
          "aria-label": "Abrir menú",
          onclick: () => {
            sidebarOpen.val = !sidebarOpen.val;
          },
        },
        "☰",
      ),
      title: getPageTitle,
      actions: [
        // Selector de Idioma embebido de VanUI
        LocaleSelector({ i18n }),

        // Selector de Tema embebido de VanUI
        ThemeToggle({ theme, i18n }),
      ],
    }),
    content: router.start(),
  });
}

