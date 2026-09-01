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
  navigate,
} from "vanui";
import { LoginPage } from "./pages/login.page.js";
import { RegisterPage } from "./pages/register.page.js";
import { GatewaysPage } from "./pages/gateways.page.js";
import { ComponentsPage } from "./pages/components.page.js";
import { i18n } from "./shared/i18n.config.js";
import { theme } from "./shared/theme.config.js";

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
  .add("/gateways", () => GatewaysPage(), {
    beforeEnter: requireAuth(authState, "/login"),
  })
  .add("/components", () => ComponentsPage())
  .redirect("/", "/gateways");

export function App() {
  void authState.boot().then(() => {
    router.resolve();
  });

  const { div, span, a, button, select, option } = van.tags;
  const sidebarOpen = van.state(false);

  const cycleTheme = () => {
    if (theme.mode.val === "system") theme.setMode("dark");
    else if (theme.mode.val === "dark") theme.setMode("light");
    else theme.setMode("system");
  };

  const themeIcon = van.derive(() => {
    if (theme.mode.val === "system") return "💻 Auto";
    return theme.mode.val === "dark" ? "🌙 Dark" : "☀️ Light";
  });

  const localeOptions = i18n.locales
    ? Object.keys(i18n.locales).map((code) => ({
        code,
        label: i18n.locales[code]?.lang?.[code] ?? code,
      }))
    : [];

  const getPageTitle = van.derive(() => {
    const p = router.path.val;
    if (p.startsWith("/gateways")) return i18n.t("gateways.title", undefined, "Pasarelas de Pago").val;
    if (p.startsWith("/components")) return i18n.t("components.title", undefined, "Catálogo de Componentes").val;
    if (p.startsWith("/login")) return i18n.t("nav.login", undefined, "Iniciar Sesión").val;
    if (p.startsWith("/register")) return "Crear Cuenta";
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
          href: "/gateways",
          class: "flex items-center gap-2.5 font-bold text-foreground tracking-tight text-lg no-underline",
          onclick: (e: MouseEvent) => {
            e.preventDefault();
            sidebarOpen.val = false;
            navigate("/gateways");
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
            href: "/gateways",
            label: i18n.t("nav.gateways"),
            icon: "💳",
            current: router.path,
            onclick: (e) => {
              e.preventDefault();
              sidebarOpen.val = false;
              navigate("/gateways");
            },
          }),
          SidebarItem({
            href: "/components",
            label: i18n.t("nav.components"),
            icon: "🧩",
            badge: "14",
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
                  label: i18n.t("nav.login"),
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
                  label: "Registro",
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
      footer: () =>
        authState.user.val
          ? div(
              { class: "flex flex-col gap-2.5 p-3 rounded-xl bg-secondary/40 border border-border/50" },
              div(
                { class: "flex items-center gap-2.5 min-w-0" },
                div(
                  {
                    class:
                      "w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center shrink-0",
                  },
                  authState.user.val.email.slice(0, 2).toUpperCase(),
                ),
                div(
                  { class: "flex flex-col min-w-0 flex-1" },
                  span({ class: "text-xs font-semibold text-foreground truncate" }, authState.user.val.email),
                  span({ class: "text-[10px] text-muted-foreground" }, "Sesión activa"),
                ),
              ),
              button(
                {
                  type: "button",
                  class:
                    "w-full text-xs font-medium py-1.5 px-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition cursor-pointer text-center",
                  onclick: async () => {
                    await authState.logout();
                    navigate("/login");
                  },
                },
                "🚪 " + i18n.t("nav.logout"),
              ),
            )
          : null,
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
        // Selector de Idioma
        select(
          {
            class:
              "text-xs px-2.5 py-1.5 rounded-lg border border-border bg-card text-foreground font-medium cursor-pointer transition-colors shadow-xs outline-none",
            "aria-label": "Idioma / Language",
            onchange: (e: Event) => i18n.setLocale((e.target as HTMLSelectElement).value),
            value: () => i18n.currentLocale.val,
          },
          localeOptions.map(({ code, label }) =>
            option({ value: code, selected: () => i18n.currentLocale.val === code }, label),
          ),
        ),

        // Selector de Tema
        button(
          {
            type: "button",
            class:
              "text-xs px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-foreground font-medium cursor-pointer transition-colors shadow-xs",
            title: "Alternar tema (Claro / Oscuro / Sistema)",
            onclick: cycleTheme,
          },
          themeIcon,
        ),
      ],
    }),
    content: router.start(),
  });
}

