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
import { GatewaysPage } from "./pages/gateways.page.js";
import { ComponentsPage } from "./pages/components.page.js";
import { i18n } from "./shared/i18n.config.js";
import { theme } from "./shared/theme.config.js";

/** Contrato de llaves de i18n para la navegación y títulos de la aplicación */
export const TEXTS = {
  nav: {
    gateways: { key: "nav.gateways", default: "Pasarelas" },
    components: { key: "nav.components", default: "Componentes" },
    login: { key: "nav.login", default: "Iniciar sesión" },
    register: { key: "nav.register", default: "Crear cuenta" },
  },
  titles: {
    gateways: { key: "gateways.title", default: "Pasarelas de Pago" },
    components: { key: "components.title", default: "Catálogo de Componentes" },
    login: { key: "login.title", default: "Iniciar sesión" },
    register: { key: "register.title", default: "Crear una cuenta" },
    dashboard: { key: "nav.dashboard", default: "Dashboard" },
  },
  groups: {
    platform: { key: "nav.platform", default: "Plataforma" },
    account: { key: "nav.account", default: "Cuenta" },
  },
} as const;

// Header Authorization con el token que gestiona createAuth (persistencia centralizada).
const authHeaders = (): Record<string, string> => {
  const token = authState.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Estado de sesión
export const authState = createAuth({
  me: async () => {
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
        headers: { Accept: "application/json", ...authHeaders() },
      });
      if (!res.ok) return { user: null, token: null };
      const data = await res.json();
      return {
        user: data.data?.user || data.user || null,
        token: data.data?.token || data.token || authState.getToken(),
      };
    } catch {
      return { user: null, token: null };
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
    return {
      user: data.data?.user || data.user,
      token: data.data?.token || data.token,
    };
  },
  register: async (registerData) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      credentials: "include",
      body: JSON.stringify(registerData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Error al registrarse");
    }
    const data = await res.json();
    return {
      user: data.data?.user || data.user,
      token: data.data?.token || data.token,
    };
  },
  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include", headers: authHeaders() });
    } catch {}
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

  const { span, a, button } = van.tags;
  const sidebarOpen = van.state(false);

  const getPageTitle = van.derive(() => {
    const p = router.path.val;
    if (p.startsWith("/gateways")) return i18n.raw(TEXTS.titles.gateways.key, undefined, TEXTS.titles.gateways.default);
    if (p.startsWith("/components")) return i18n.raw(TEXTS.titles.components.key, undefined, TEXTS.titles.components.default);
    if (p.startsWith("/login")) return i18n.raw(TEXTS.titles.login.key, undefined, TEXTS.titles.login.default);
    if (p.startsWith("/register")) return i18n.raw(TEXTS.titles.register.key, undefined, TEXTS.titles.register.default);
    return i18n.raw(TEXTS.titles.dashboard.key, undefined, TEXTS.titles.dashboard.default);
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
          { title: i18n.t(TEXTS.groups.platform.key, undefined, TEXTS.groups.platform.default) },
          SidebarItem({
            href: "/gateways",
            label: i18n.t(TEXTS.nav.gateways.key, undefined, TEXTS.nav.gateways.default),
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
            label: i18n.t(TEXTS.nav.components.key, undefined, TEXTS.nav.components.default),
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
                { title: i18n.t(TEXTS.groups.account.key, undefined, TEXTS.groups.account.default) },
                SidebarItem({
                  href: "/login",
                  label: i18n.t(TEXTS.nav.login.key, undefined, TEXTS.nav.login.default),
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
                  label: i18n.t(TEXTS.nav.register.key, undefined, TEXTS.nav.register.default),
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

